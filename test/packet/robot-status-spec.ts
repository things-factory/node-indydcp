import { expect } from 'chai'
import { RobotStatus } from '../../src/robot-status'

describe('Packet', function () {
  describe('RobotStatus', function () {
    it('should return true when the flags are all set', async function () {
      var robotStatus = RobotStatus.from(0b11111111111111111111111111111111111)

      expect(robotStatus.is_robot_running).to.be.true
      expect(robotStatus.is_robot_ready).to.be.true
      expect(robotStatus.is_emergency_stop).to.be.true
      expect(robotStatus.is_collided).to.be.true
      expect(robotStatus.is_error_state).to.be.true
      expect(robotStatus.is_busy).to.be.true
      expect(robotStatus.is_move_finished).to.be.true
      expect(robotStatus.is_home).to.be.true
      expect(robotStatus.is_zero).to.be.true
      expect(robotStatus.is_in_resetting).to.be.true
      expect(robotStatus.is_direct_teaching_mode).to.be.true
      expect(robotStatus.is_teaching_mode).to.be.true
      expect(robotStatus.is_program_running).to.be.true
      expect(robotStatus.is_program_paused).to.be.true
      expect(robotStatus.is_conty_connected).to.be.true
    })

    it('should return false when the flags are all unset', async function () {
      var robotStatus = RobotStatus.from(0b0000000000000000000000000000000000)

      expect(robotStatus.is_robot_running).to.be.false
      expect(robotStatus.is_robot_ready).to.be.false
      expect(robotStatus.is_emergency_stop).to.be.false
      expect(robotStatus.is_collided).to.be.false
      expect(robotStatus.is_error_state).to.be.false
      expect(robotStatus.is_busy).to.be.false
      expect(robotStatus.is_move_finished).to.be.false
      expect(robotStatus.is_home).to.be.false
      expect(robotStatus.is_zero).to.be.false
      expect(robotStatus.is_in_resetting).to.be.false
      expect(robotStatus.is_direct_teaching_mode).to.be.false
      expect(robotStatus.is_teaching_mode).to.be.false
      expect(robotStatus.is_program_running).to.be.false
      expect(robotStatus.is_program_paused).to.be.false
      expect(robotStatus.is_conty_connected).to.be.false
    })
  })
})
