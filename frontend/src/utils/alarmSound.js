/**
 * Audio alarm utility for distraction detection alerts
 * Generates and plays an alarm sound using Web Audio API
 */

export class AlarmSound {
  constructor() {
    this.audioContext = null
    this.oscillators = []
    this.isPlaying = false
  }

  /**
   * Initialize audio context (requires user interaction)
   */
  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  /**
   * Play a beeping alarm sound
   * @param {number} duration - Duration in milliseconds (default 3000)
   * @param {number} frequency1 - First frequency in Hz (default 800)
   * @param {number} frequency2 - Second frequency in Hz (default 600)
   */
  playAlarm(duration = 3000, frequency1 = 800, frequency2 = 600) {
    if (!this.audioContext) {
      console.warn('Audio context not initialized')
      return
    }

    if (this.isPlaying) {
      this.stopAlarm()
    }

    this.isPlaying = true
    const startTime = this.audioContext.currentTime
    const endTime = startTime + duration / 1000

    // Create oscillators
    const osc1 = this.audioContext.createOscillator()
    const osc2 = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    // Set frequencies
    osc1.frequency.value = frequency1
    osc2.frequency.value = frequency2

    // Connect nodes
    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // Set volume
    gainNode.gain.setValueAtTime(0.3, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, endTime)

    // Create pulsing effect
    const pulseRate = 0.1 // Pulse every 100ms
    for (let t = startTime; t < endTime; t += pulseRate) {
      osc1.frequency.setValueAtTime(frequency1, t)
      osc1.frequency.setValueAtTime(frequency2, t + pulseRate / 2)
    }

    // Start and stop
    osc1.start(startTime)
    osc2.start(startTime)

    setTimeout(() => {
      osc1.stop()
      osc2.stop()
      this.isPlaying = false
    }, duration)

    this.oscillators = [osc1, osc2]
  }

  /**
   * Stop the alarm immediately
   */
  stopAlarm() {
    if (this.isPlaying && this.oscillators.length > 0) {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop()
        } catch (e) {
          // Already stopped
        }
      })
      this.oscillators = []
      this.isPlaying = false
    }
  }

  /**
   * Play single beep (good for responses)
   */
  playBeep(frequency = 1000, duration = 200) {
    if (!this.audioContext) {
      console.warn('Audio context not initialized')
      return
    }

    const startTime = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    osc.frequency.value = frequency
    gainNode.gain.setValueAtTime(0.2, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration / 1000)

    osc.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    osc.start(startTime)
    osc.stop(startTime + duration / 1000)
  }
}

// Create a singleton instance
export const alarmSound = new AlarmSound()
