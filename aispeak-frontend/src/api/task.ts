import request from "@/axios/api";

export default {
  // 班级管理
  createClass: (data: any) => {
    return request("/classes", "POST", data);
  },
  getClassById: (classId: string) => {
    return request(`/classes/${classId}`, "GET");
  },
  updateClass: (classId: string, data: any) => {
    return request(`/classes/${classId}`, "PUT", data);
  },
  deleteClass: (classId: string) => {
    return request(`/classes/${classId}`, "DELETE");
  },
  listClasses: (params: any) => {
    return request("/classes", "GET", params);
  },
  getStudentClasses: () => {
    return request("/student/classes", "GET");
  },
  getTeacherClasses: (teacherId: string) => {
    return request(`/teacher/${teacherId}/classes`, "GET");
  },
  joinClass: (data: any) => {
    return request("/classes/join", "POST", data);
  },
  
  // 班级成员管理
  getClassStudents: (classId: string) => {
    return request(`/classes/${classId}/students`, "GET");
  },
  addStudentToClass: (classId: string, data: any) => {
    return request(`/classes/${classId}/students`, "POST", data);
  },
  removeStudentFromClass: (classId: string, studentId: string) => {
    return request(`/classes/${classId}/students/${studentId}`, "DELETE");
  },
  addTeacherToClass: (classId: string, data: any) => {
    return request(`/classes/${classId}/teachers`, "POST", data);
  },
  removeTeacherFromClass: (classId: string, teacherId: string) => {
    return request(`/classes/${classId}/teachers/${teacherId}`, "DELETE");
  },
  
  // 任务管理
  createTask: (data: any) => {
    return request("/tasks", "POST", data);
  },
  getTaskById: (taskId: string) => {
    return request(`/tasks/${taskId}`, "GET");
  },
  updateTask: (taskId: string, data: any) => {
    return request(`/tasks/${taskId}`, "PUT", data);
  },
  deleteTask: (taskId: string) => {
    return request(`/tasks/${taskId}`, "DELETE");
  },
  listTasks: (params: any) => {
    return request("/tasks", "GET", params);
  },
  
  // 提交管理
  createSubmission: (taskId: string, data: any) => {
    return request(`/tasks/${taskId}/submissions`, "POST", data);
  },
  getSubmissionById: (submissionId: string) => {
    return request(`/submissions/${submissionId}`, "GET");
  },
  gradeSubmission: (submissionId: string, data: any) => {
    return request(`/submissions/${submissionId}/grade`, "POST", data);
  },
  getTaskSubmissions: (taskId: string, params: any) => {
    return request(`/tasks/${taskId}/submissions`, "GET", params);
  },
  listSubmissions: (params: any) => {
    return request("/submissions", "GET", params);
  },
  
  // 内容搜索
  searchContent: (data: any) => {
    return request("/search-content", "POST", data);
  }
};