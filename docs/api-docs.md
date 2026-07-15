# Auto-generated API Docs

Total endpoints: 62

| Method | Path                                                       | Handler                    | Source File                     |
| ------ | ---------------------------------------------------------- | -------------------------- | ------------------------------- |
| GET    | /api/admin/dashboard                                       | getDashboard               | routes/adminRoutes.js           |
| PATCH  | /api/admin/teachers/:teacherId/verify                      | verifyTeacher              | routes/adminRoutes.js           |
| GET    | /api/admin/users                                           | getUsers                   | routes/adminRoutes.js           |
| DELETE | /api/admin/users/:id                                       | deleteUser                 | routes/adminRoutes.js           |
| GET    | /api/admin/users/:id                                       | getUserById                | routes/adminRoutes.js           |
| PATCH  | /api/admin/users/:id/role                                  | updateUserRole             | routes/adminRoutes.js           |
| PATCH  | /api/admin/users/:id/status                                | updateUserStatus           | routes/adminRoutes.js           |
| PATCH  | /api/auth/change-password                                  | changePassword             | routes/authRoutes.js            |
| POST   | /api/auth/login                                            | login                      | routes/authRoutes.js            |
| POST   | /api/auth/logout                                           | logout                     | routes/authRoutes.js            |
| GET    | /api/auth/me                                               | me                         | routes/authRoutes.js            |
| PATCH  | /api/auth/profile                                          | updateProfile              | routes/authRoutes.js            |
| POST   | /api/auth/register                                         | register                   | routes/authRoutes.js            |
| GET    | /api/learning/admin/contents                               | getAdminLearningContents   | routes/learningContentRoutes.js |
| POST   | /api/learning/admin/contents                               | createLearningContent      | routes/learningContentRoutes.js |
| DELETE | /api/learning/admin/contents/:id                           | deleteLearningContent      | routes/learningContentRoutes.js |
| PATCH  | /api/learning/admin/contents/:id                           | updateLearningContent      | routes/learningContentRoutes.js |
| GET    | /api/learning/contents                                     | getLearningContents        | routes/learningContentRoutes.js |
| PATCH  | /api/learning/contents/:id/favorite                        | toggleLearningFavorite     | routes/learningContentRoutes.js |
| POST   | /api/learning/contents/:id/progress                        | updateLearningProgress     | routes/learningContentRoutes.js |
| GET    | /api/learning/summary                                      | getLearningSummary         | routes/learningContentRoutes.js |
| GET    | /api/lessons                                               | getLessons                 | routes/lessonRoutes.js          |
| POST   | /api/lessons                                               | createLesson               | routes/lessonRoutes.js          |
| GET    | /api/lessons/:id                                           | getLesson                  | routes/lessonRoutes.js          |
| PATCH  | /api/lessons/:id                                           | updateLesson               | routes/lessonRoutes.js          |
| PATCH  | /api/lessons/:id/attendance                                | confirmAttendance          | routes/lessonRoutes.js          |
| PATCH  | /api/lessons/:id/cancel                                    | cancelLesson               | routes/lessonRoutes.js          |
| PATCH  | /api/lessons/:id/complete                                  | completeLesson             | routes/lessonRoutes.js          |
| PATCH  | /api/lessons/:id/start                                     | startLesson                | routes/lessonRoutes.js          |
| GET    | /api/quizzes                                               | getQuizzes                 | routes/quizRoutes.js            |
| POST   | /api/quizzes                                               | createQuiz                 | routes/quizRoutes.js            |
| DELETE | /api/quizzes/:quizId                                       | deleteQuiz                 | routes/quizRoutes.js            |
| GET    | /api/quizzes/:quizId                                       | getQuiz                    | routes/quizRoutes.js            |
| PATCH  | /api/quizzes/:quizId                                       | updateQuiz                 | routes/quizRoutes.js            |
| GET    | /api/quizzes/:quizId/admin-questions                       | getAdminQuestions          | routes/quizRoutes.js            |
| POST   | /api/quizzes/:quizId/attempts/start                        | startQuizAttempt           | routes/quizRoutes.js            |
| GET    | /api/quizzes/:quizId/questions                             | getQuestions               | routes/quizRoutes.js            |
| POST   | /api/quizzes/:quizId/questions                             | createQuestion             | routes/quizRoutes.js            |
| GET    | /api/quizzes/admin/all                                     | getAdminQuizzes            | routes/quizRoutes.js            |
| GET    | /api/quizzes/admin/attempts                                | getAdminAttempts           | routes/quizRoutes.js            |
| GET    | /api/quizzes/admin/retake-permissions                      | getAdminRetakePermissions  | routes/quizRoutes.js            |
| POST   | /api/quizzes/admin/retake-permissions                      | grantQuizRetakePermission  | routes/quizRoutes.js            |
| PATCH  | /api/quizzes/admin/retake-permissions/:permissionId/revoke | revokeQuizRetakePermission | routes/quizRoutes.js            |
| GET    | /api/quizzes/admin/stats                                   | getAdminQuizStats          | routes/quizRoutes.js            |
| POST   | /api/quizzes/attempts/:attemptId/answer                    | submitQuizAnswer           | routes/quizRoutes.js            |
| POST   | /api/quizzes/attempts/:attemptId/finish                    | finishQuizAttempt          | routes/quizRoutes.js            |
| GET    | /api/quizzes/attempts/:attemptId/review                    | getQuizAttemptReview       | routes/quizRoutes.js            |
| GET    | /api/quizzes/attempts/me                                   | getMyQuizAttempts          | routes/quizRoutes.js            |
| DELETE | /api/quizzes/questions/:questionId                         | deleteQuestion             | routes/quizRoutes.js            |
| GET    | /api/quizzes/questions/:questionId                         | getQuestionById            | routes/quizRoutes.js            |
| PATCH  | /api/quizzes/questions/:questionId                         | updateQuestion             | routes/quizRoutes.js            |
| GET    | /api/quizzes/retake-permissions/me                         | getMyRetakePermissions     | routes/quizRoutes.js            |
| POST   | /api/quizzes/road-signs                                    | createRoadSign             | routes/quizRoutes.js            |
| GET    | /api/quizzes/road-signs/list                               | getRoadSigns               | routes/quizRoutes.js            |
| GET    | /api/teachers/dashboard                                    | getDashboard               | routes/teacherRoutes.js         |
| GET    | /api/teachers/locations                                    | getLocations               | routes/teacherRoutes.js         |
| POST   | /api/teachers/locations                                    | addLocation                | routes/teacherRoutes.js         |
| GET    | /api/teachers/profile                                      | getProfile                 | routes/teacherRoutes.js         |
| PATCH  | /api/teachers/profile                                      | updateProfile              | routes/teacherRoutes.js         |
| GET    | /api/teachers/public                                       | getPublicTeachers          | routes/teacherRoutes.js         |
| GET    | /api/teachers/vehicles                                     | getVehicles                | routes/teacherRoutes.js         |
| POST   | /api/teachers/vehicles                                     | addVehicle                 | routes/teacherRoutes.js         |

This file is generated from the route files in the repository.
Restart the server after adding a new route to refresh it.
