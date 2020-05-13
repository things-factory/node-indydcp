import { bin } from './utils'

enum StatusFlag {
  is_robot_running = 0,
  is_robot_ready = 1,
  is_emergency_stop = 2,
  is_collided = 3,
  is_error_state = 4,
  is_busy = 5,
  is_move_finished = 6,
  is_home = 7,
  is_zero = 8,
  is_in_resetting = 9,
  is_direct_teaching_mode = 24,
  is_teaching_mode = 25,
  is_program_running = 26,
  is_program_paused = 27,
  is_conty_connected = 28
}

export class RobotStatus {
  static from(wordStatus: Number) {
    var status_str = bin(wordStatus)
    var robotStatus = new RobotStatus()

    for (let prop in StatusFlag) {
      robotStatus[prop] = status_str[StatusFlag[prop]] == '1'
    }

    // robotStatus.is_robot_running = status_str[0] == '1'
    // robotStatus.is_robot_ready = status_str[1] == '1'
    // robotStatus.is_emergency_stop = status_str[2] == '1'
    // robotStatus.is_collided = status_str[3] == '1'
    // robotStatus.is_error_state = status_str[4] == '1'
    // robotStatus.is_busy = status_str[5] == '1'
    // robotStatus.is_move_finished = status_str[6] == '1'
    // robotStatus.is_home = status_str[7] == '1'
    // robotStatus.is_zero = status_str[8] == '1'
    // robotStatus.is_in_resetting = status_str[9] == '1'
    // robotStatus.is_direct_teaching_mode = status_str[24] == '1'
    // robotStatus.is_teaching_mode = status_str[25] == '1'
    // robotStatus.is_program_running = status_str[26] == '1'
    // robotStatus.is_program_paused = status_str[27] == '1'
    // robotStatus.is_conty_connected = status_str[28] == '1'

    return robotStatus
  }

  public is_robot_running: boolean
  public is_robot_ready: boolean
  public is_emergency_stop: boolean
  public is_collided: boolean
  public is_error_state: boolean
  public is_busy: boolean
  public is_move_finished: boolean
  public is_home: boolean
  public is_zero: boolean
  public is_in_resetting: boolean
  public is_direct_teaching_mode: boolean
  public is_teaching_mode: boolean
  public is_program_running: boolean
  public is_program_paused: boolean
  public is_conty_connected: boolean
}
