/* Robot Type */
export const ROBOT_INDY7 = 'NRMK-Indy7'
export const ROBOT_INDYRP2 = 'NRMK-IndyRP2'
export const ROBOT_INDY12 = 'NRMK-Indy12'

/* DirectVariableType */
export enum DirectVariableType {
  ERROR = -1,
  BYTE = 0,
  WORD = 1,
  DWORD = 2,
  LWORD = 3,
  FLOAT = 4,
  DFLOAT = 5,
  MODBUS_REG = 10
}

/* Indy Client Interface */
export interface IIndyDCPClient {
  JOINT_DOF
  lock
  sock_fd
  time_out
  invokeId
  serverIp
  robotName
  robotVersion
  robotStatus
  stepInfo
  sofClient

  connect()
  disconnect()
  shutdown()
  set_timeout_sec(time_out)
  _send_message(buf, size)
  _recv_message(buf, size)
  get_robotStatus()
  handle_command(cmd, req_data, req_data_size): { error_code; res_data; res_data_size }
  handle_extended_command(ext_cmd, req_ext_data, req_ext_data_size): { error_code; res_data; res_data_size }
  /* Robot command function (Check all) */
  check()
  emergency_stop()
  reset_robot()
  set_servo(arr)
  set_brake(arr)
  stop_motion()
  execute_move(cmd_name)
  // Move commands
  go_home()
  go_zero()
  _7dof_joint_move_to(q)
  _6dof_joint_move_to(q)
  joint_move_to(q)
  _7dof_joint_move_by(q)
  _6dof_joint_move_by(q)
  joint_move_by(q)
  task_move_to(p)
  task_move_by(p)
  // Program control
  start_current_program()
  pause_current_program()
  resume_current_program()
  stop_current_program()
  start_default_program()
  set_default_program(idx)
  get_default_program_idx()
  // Get robot status
  is_robot_running()
  is_robot_ready()
  is_emergency_stop()
  is_collided()
  is_error_state()
  is_busy()
  is_move_finished()
  is_home()
  is_zero()
  is_in_resetting()
  is_direct_teaching_mode()
  is_teaching_mode()
  is_program_running()
  is_program_paused()
  is_conty_connected()
  // Direct teaching

  change_to_direct_teaching()
  finish_direct_teaching()
  push_back_joint_waypoint(q)
  pop_back_joint_waypoint()
  clear_joint_waypoints()
  execute_joint_waypoints()
  push_back_task_waypoint(p)
  pop_back_task_waypoint()
  clear_task_waypoints()
  execute_task_waypoints()
  // Get/Set some global robot variables

  set_default_tcp(tcp)
  reset_default_tcp()
  set_tcp_compensation(tcp)
  reset_tcp_compensation()
  set_ref_frame(ref)
  reset_ref_frame()
  set_collision_level(level)
  set_joint_speed_level(level)
  set_task_speed_level(level)
  set_joint_waypoint_time(time)
  set_task_waypoint_time(time)
  set_task_base_mode(mode)
  set_joint_blend_radius(radius)
  set_task_blend_radius(radius)
  get_default_tcp()
  get_tcp_compensation()
  get_ref_frame()
  get_collision_level()
  get_joint_speed_level()
  get_task_speed_level()
  get_joint_waypoint_time()
  get_task_waypoint_time()
  get_task_base_mode()
  get_joint_blend_radius()
  get_task_blend_radius()
  get_robot_running_time()
  get_cmode()
  get_servo_state()
  get_joint_pos()
  get_joint_vel()
  get_task_pos()
  get_task_vel()
  get_torque()
  get_last_emergency_info()
  // I/O

  get_smart_di(idx)
  get_smart_dis()
  set_smart_do(idx, val)
  set_smart_dos(idx)
  get_smart_ai(idx)
  set_smart_ao(idx, val)
  get_smart_do(idx)
  get_smart_dos()
  get_smart_ao(idx)
  set_endtool_do(endtool_type, val)
  get_endtool_do(type)
  // FT sensor implementation

  get_robot_ft_sensor_raw()
  get_robot_ft_sensor_process()
  get_cb_ft_sensor_raw()
  get_cb_ft_sensor_process()
  read_direct_variable(dv_type, dv_addr)
  read_direct_variables(dv_type, dv_addr, dv_len)
  write_direct_variable(dv_type, dv_addr, val)
  write_direct_variables(dv_type, dv_addr, dv_len, val)
  // Not released

  set_reduced_mode(mode)
  set_reduced_speed_ratio(ratio)
  get_reduced_mode()
  get_reduced_speed_ratio()
  /* Extended IndyDCP command (Check all) */

  move_ext_traj_bin(traj_type, traj_freq, dat_size, traj_data, dat_num)
  move_ext_traj_txt(traj_type, traj_freq, dat_size, traj_data, dat_num)
  move_ext_traj_bin_file(file_name)
  move_ext_traj_txt_file(file_name)
  joint_move_to_wp_set()
  task_move_to_wp_set()
  /* JSON programming added (only for internal engineer) */
  set_json_program()
  set_and_start_json_program(json_string)
  wait_for_program_finish()
  set_workspace(cmd_pos)
  /* Teaching points */
  load_teaching_data(file_name)
  update_teaching_data(file_name, wp_name, j_pos)
  del_teaching_data(file_name, wp_name)
}
