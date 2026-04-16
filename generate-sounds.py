#!/usr/bin/env python3
"""
Generate simple notification sound files for Kinzola dating app.
Uses Web Audio API-compatible sine wave tones.
"""

import struct
import math
import os

SAMPLE_RATE = 44100

def generate_wav(filename, frequencies, duration=0.3, volume=0.5, fade_out=0.1):
    """Generate a WAV file with given frequencies (list of tuples: (freq, start_time, end_time))"""
    num_samples = int(SAMPLE_RATE * duration)
    
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        sample = 0
        
        for freq, start, end in frequencies:
            if start <= t <= end:
                # Apply envelope
                envelope = 1.0
                # Attack
                attack_time = 0.01
                if t - start < attack_time:
                    envelope = (t - start) / attack_time
                
                # Fade out
                if end - t < fade_out:
                    envelope = min(envelope, (end - t) / fade_out)
                
                sample += math.sin(2 * math.pi * freq * t) * envelope
        
        sample = max(-1, min(1, sample * volume))
        samples.append(int(sample * 32767))
    
    # Write WAV file
    num_channels = 1
    bits_per_sample = 16
    byte_rate = SAMPLE_RATE * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align
    
    with open(filename, 'wb') as f:
        # RIFF header
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + data_size))
        f.write(b'WAVE')
        
        # fmt chunk
        f.write(b'fmt ')
        f.write(struct.pack('<I', 16))  # chunk size
        f.write(struct.pack('<H', 1))   # PCM format
        f.write(struct.pack('<H', num_channels))
        f.write(struct.pack('<I', SAMPLE_RATE))
        f.write(struct.pack('<I', byte_rate))
        f.write(struct.pack('<H', block_align))
        f.write(struct.pack('<H', bits_per_sample))
        
        # data chunk
        f.write(b'data')
        f.write(struct.pack('<I', data_size))
        for s in samples:
            f.write(struct.pack('<h', s))

os.makedirs('/home/z/my-project/public/sounds', exist_ok=True)

# Default notification: gentle two-tone chime
generate_wav(
    '/home/z/my-project/public/sounds/notification-default.mp3.wav',
    [(880, 0.0, 0.15), (1100, 0.1, 0.25)],
    duration=0.3,
    volume=0.4
)

# Match notification: exciting ascending melody
generate_wav(
    '/home/z/my-project/public/sounds/notification-match.mp3.wav',
    [(523, 0.0, 0.1), (659, 0.1, 0.2), (784, 0.2, 0.35), (1047, 0.3, 0.5)],
    duration=0.5,
    volume=0.5
)

# Like notification: short pleasant ding
generate_wav(
    '/home/z/my-project/public/sounds/notification-like.mp3.wav',
    [(1200, 0.0, 0.12)],
    duration=0.15,
    volume=0.35
)

# Message notification: soft double ping
generate_wav(
    '/home/z/my-project/public/sounds/notification-message.mp3.wav',
    [(900, 0.0, 0.08), (1050, 0.1, 0.18)],
    duration=0.25,
    volume=0.4
)

# Badge notification: triumphant fanfare
generate_wav(
    '/home/z/my-project/public/sounds/notification-badge.mp3.wav',
    [(440, 0.0, 0.1), (554, 0.1, 0.2), (659, 0.2, 0.35), (880, 0.35, 0.55)],
    duration=0.6,
    volume=0.45
)

print("All notification sounds generated successfully!")
print("Files created in /home/z/my-project/public/sounds/")
