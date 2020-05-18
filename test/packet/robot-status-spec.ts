import { expect } from 'chai'
import { RobotStatus } from '../../src/robot-status'

describe('Packet', function () {
  describe('RobotStatus', function () {
    it('should return true when the flags are all set', async function () {
      var robotStatus = RobotStatus.from(0b11111111111111111111111111111111111)

      expect(robotStatus.isRobotRunning).to.be.true
      expect(robotStatus.isRobotReady).to.be.true
      expect(robotStatus.is_emergencyStop).to.be.true
      expect(robotStatus.isCollided).to.be.true
      expect(robotStatus.is_errorState).to.be.true
      expect(robotStatus.isBusy).to.be.true
      expect(robotStatus.isMoveFinished).to.be.true
      expect(robotStatus.isHome).to.be.true
      expect(robotStatus.isZero).to.be.true
      expect(robotStatus.isInResetting).to.be.true
      expect(robotStatus.isDirectTeachingMode).to.be.true
      expect(robotStatus.isTeachingMode).to.be.true
      expect(robotStatus.isProgramRunning).to.be.true
      expect(robotStatus.isProgramPaused).to.be.true
      expect(robotStatus.isContyConnected).to.be.true
    })

    it('should return false when the flags are all unset', async function () {
      var robotStatus = RobotStatus.from(0b0000000000000000000000000000000000)

      expect(robotStatus.isRobotRunning).to.be.false
      expect(robotStatus.isRobotReady).to.be.false
      expect(robotStatus.is_emergencyStop).to.be.false
      expect(robotStatus.isCollided).to.be.false
      expect(robotStatus.is_errorState).to.be.false
      expect(robotStatus.isBusy).to.be.false
      expect(robotStatus.isMoveFinished).to.be.false
      expect(robotStatus.isHome).to.be.false
      expect(robotStatus.isZero).to.be.false
      expect(robotStatus.isInResetting).to.be.false
      expect(robotStatus.isDirectTeachingMode).to.be.false
      expect(robotStatus.isTeachingMode).to.be.false
      expect(robotStatus.isProgramRunning).to.be.false
      expect(robotStatus.isProgramPaused).to.be.false
      expect(robotStatus.isContyConnected).to.be.false
    })
  })
})
