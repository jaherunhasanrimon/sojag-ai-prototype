/**
 * tests/unit/sync.test.ts — Unit tests for BroadcastChannel multi-window sync (Phase 6).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initSync,
  cleanupSync,
  isLeader,
  broadcastSnapshot,
  sendIntent,
  SYNC_CHANNEL_NAME,
} from '../../src/services/sync';
import { useAppStore } from '../../src/store/store';
import { useDemoClock } from '../../src/services/clock';

// Mock BroadcastChannel implementation for jsdom
class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: any) => void) | null = null;
  static channels = new Map<string, Set<MockBroadcastChannel>>();

  constructor(name: string) {
    this.name = name;
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name)!.add(this);
  }

  postMessage(data: any) {
    const peers = MockBroadcastChannel.channels.get(this.name);
    if (!peers) return;
    for (const peer of peers) {
      if (peer !== this && peer.onmessage) {
        peer.onmessage({ data } as any);
      }
    }
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

describe('Multi-Window Sync Service', () => {
  let originalBC: any;

  beforeEach(() => {
    originalBC = globalThis.BroadcastChannel;
    MockBroadcastChannel.channels.clear();
    (globalThis as any).BroadcastChannel = MockBroadcastChannel;
    useAppStore.setState({ incidents: [], auditLog: [] });
    useDemoClock.getState().reset();
  });

  afterEach(() => {
    cleanupSync();
    (globalThis as any).BroadcastChannel = originalBC;
    vi.restoreAllMocks();
  });

  it('initializes as leader when preferredRole is leader', () => {
    initSync('leader');
    expect(isLeader()).toBe(true);
  });

  it('initializes as follower when preferredRole is follower', () => {
    initSync('follower');
    expect(isLeader()).toBe(false);
  });

  it('broadcasts snapshot to peer follower channel and applies state', () => {
    // Window 1: Leader
    initSync('leader');

    // Populate leader store
    useAppStore.setState({
      demoStarted: true,
      incidents: [
        {
          id: 'STK-001',
          cueId: 'c1',
          clipId: 'cl1',
          cameraId: 'CAM-01',
          title: 'Test Incident',
          eventType: 'altercation',
          confidence: 0.9,
          priority: 'HIGH',
          status: 'ACTIVE',
          firedAtDemoMs: 1000,
          firedAtWall: '10:00:01',
          truth: 'crime_like',
          log: [],
        },
      ],
    });

    // Window 2: Follower channel listening on same name
    const followerBC = new MockBroadcastChannel(SYNC_CHANNEL_NAME);
    let receivedSnapshot: any = null;
    followerBC.onmessage = (event) => {
      if (event.data?.type === 'SNAPSHOT') {
        receivedSnapshot = event.data.snapshot;
      }
    };

    // Leader broadcasts
    broadcastSnapshot();

    expect(receivedSnapshot).toBeDefined();
    expect(receivedSnapshot.incidents).toHaveLength(1);
    expect(receivedSnapshot.incidents[0].id).toBe('STK-001');
    expect(receivedSnapshot.demoStarted).toBe(true);

    followerBC.close();
  });

  it('handles follower intent sent to leader', () => {
    initSync('leader');

    const pullSpy = vi.spyOn(useAppStore.getState(), 'pullNextIncident');

    // Simulate intent from follower
    sendIntent({ type: 'PULL_NEXT' });

    // Since we called sendIntent locally while leader, it processes it
    expect(pullSpy).toHaveBeenCalled();
  });

  it('promotes follower to leader if heartbeat times out (>3s)', () => {
    vi.useFakeTimers();

    initSync('follower');
    expect(isLeader()).toBe(false);

    // Fast forward 3.5 seconds without leader heartbeats
    vi.advanceTimersByTime(3500);

    expect(isLeader()).toBe(true);

    vi.useRealTimers();
  });
});
