document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('menuToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
    });

    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');

        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });
});


new Vue({
    el: '#app',
    data: {
        isMouseDownOnModal: false,
        isMouseDownOnBackdrop: false,
        isUserModalOpen: false,
        isLogInModalOpen: false,
        isPasswordVisible: false,
        isPassword2Visible: false,
        isPasswordLoginVisible: false
    },
    methods: {
        showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerText = message;

            document.getElementById('notifications').appendChild(notification);
            notification.style.display = 'block';

            setTimeout(() => {
                notification.style.display = 'none';
                notification.remove();
            }, 3000);
        },
        handleMouseDown(event) {
            if (event.target === event.currentTarget) {
                this.isMouseDownOnBackdrop = true;
            }
        },
        handleMouseUp(event) {
            if (this.isMouseDownOnBackdrop && event.target === event.currentTarget) {
                if (this.isUserModalOpen) {
                    this.closeUserModal();
                } 
                else if (this.isLogInModalOpen) {
                    this.closeLogInModal();
                }
            }
            this.isMouseDownOnBackdrop = false;
        },
        openUserModal() {  
            this.isUserModalOpen = true;
        },
        submitUserForm() {
            const login = document.getElementById('user-login').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const password_repeat = document.getElementById('user-password-repeat').value;
        
            if (password !== password_repeat) {
                this.showNotification('Пароли не совпадают!', 'error');
                return;
            }
        
            fetch('/SignUpUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    login: login,
                    email: email,
                    password: password,
                }),
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        if (text.includes('PasswordIsTooWeak')) {
                            return this.showNotification('Пароль слишком слабый.', 'error');
                        } else if (text.includes('UserAlreadyExistsWithEmail')) {
                            return this.showNotification('Пользователь с таким email уже существует.', 'error');
                        } else if (text.includes('UserAlreadyExistsWithLogin')) {
                            return this.showNotification('Это имя пользователя уже занято', 'error');
                        } else if (text.includes('Badrequest')) {
                            return this.showNotification('Ошибка базы данных. Попробуйте позже.', 'error');
                        } else if (text.includes('InternalServerError')) {
                            return this.showNotification('Ошибка сервера. Попробуйте позже.', 'error');
                        } else {
                            return this.showNotification('Неизвестная ошибка. Попробуйте снова.', 'error');
                        }
                    });
                }
                else{
                    this.showNotification('Подтвердите аккаунта в своем почтовом ящике!', 'success');
                }
            })
            .catch((error) => {
                console.error('Ошибка:', error);
                this.showNotification('Ошибка регистрации. Попробуйте еще раз.', 'error');
            });
        },
        closeUserModal(){
            this.isUserModalOpen = false;
        },
        openLogInModal() {
            // this.closeSignUpModal();
            this.isLogInModalOpen = true;
            // const signUpLogin = document.getElementById('SignUpLogin');
            // const signUpEmail = document.getElementById('SignUpEmail');
            // const signUpPassword = document.getElementById('SignUpPassword');
            // const signUpPassword2 = document.getElementById('SignUpPassword2');
        
            // if (signUpLogin) signUpLogin.value = '';
            // if (signUpEmail) signUpEmail.value = '';
            // if (signUpPassword) signUpPassword.value = '';
            // if (signUpPassword2) signUpPassword2.value = '';
        },
        submitLogInForm() {
            const login = document.getElementById('auth-email-login-nickname').value;
            const password = document.getElementById('auth-password').value;
        
            fetch('/LogIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    login: login,
                    password: password,
                }),
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        if (text.includes('UserNotFound')) {
                            return this.showNotification('Пользователь не найден.', 'error');
                        } else if (text.includes('UserIsBanned')) {
                            return this.showNotification('Пользователь забанен.', 'error');
                        } else if (text.includes('InvalidCredentials')) {
                            return this.showNotification('Неверный пароль.', 'error');
                        } else if (text.includes('InternalServerError')) {
                            return this.showNotification('Ошибка сервера!', 'error');
                        } else if (text.includes('Bad request')) {
                            return this.showNotification('Плохое соединение!', 'error');
                        } else {
                            return this.showNotification('Неизвестная ошибка. Попробуйте снова.', 'error');
                        }
                    });
                } else {
                    this.showNotification('Вход выполнен успешно!', 'success');
                            window.location.href = '/public/User.html'; // Перенаправляем на страницу пользователя
                    }
            })
            .catch((error) => {
                console.error('Ошибка:', error);
                this.showNotification('Ошибка входа. Попробуйте еще раз.', 'error');
            });
        },
        closeLogInModal(){
            this.isLogInModalOpen = false;
        },
        submitAuthorForm() {
            const login = document.getElementById('author-login').value;
            const email = document.getElementById('author-email').value;
            const password = document.getElementById('author-password').value;
            const password_repeat = document.getElementById('author-password-repeat').value;
            const nickname = document.getElementById('author-nickname').value;
            const author_vk = document.getElementById('author-vk').value;
        
            if (password !== password_repeat) {
                this.showNotification('Пароли не совпадают!', 'error');
                return;
            }
        
            fetch('/SignUpAuthor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    login: login,
                    email: email,
                    password: password,
                    nickname: nickname,
                    author_vk: author_vk
                }),
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        if (text.includes('PasswordIsTooWeak')) {
                            return this.showNotification('Пароль слишком слабый.', 'error');
                        } else if (text.includes('UserAlreadyWithEmail')) {
                            return this.showNotification('Пользователь с таким email уже существует.', 'error');
                        } else if (text.includes('UserAlreadyExistsWithLogin')) {
                            return this.showNotification('Это имя пользователя уже занято', 'error');
                        } else if (text.includes('UserAlreadyExistsWithNickname')) {
                            return this.showNotification('Это имя пользователя уже занято', 'error');
                        } else if (text.includes('UserAlreadyExistsWithAuthorVk')) {
                            return this.showNotification('Это имя пользователя уже занято', 'error');
                        } else if (text.includes('Badrequest')) {
                            return this.showNotification('Ошибка базы данных. Попробуйте позже.', 'error');
                        } else if (text.includes('InternalServerError')) {
                            return this.showNotification('Ошибка сервера. Попробуйте позже.', 'error');
                        } else {
                            return this.showNotification('Неизвестная ошибка. Попробуйте снова.', 'error');
                        }
                    });
                }
                else{
                    this.showNotification('Подтвердите аккаунта в своем почтовом ящике!', 'success');
                }
            })
            .catch((error) => {
                console.error('Ошибка:', error);
                this.showNotification('Ошибка регистрации. Попробуйте еще раз.', 'error');
            });
        },
        togglePasswordVisibility() {
            this.isPasswordVisible = !this.isPasswordVisible;
        },
        togglePassword2Visibility() {
            this.isPassword2Visible = !this.isPassword2Visible;
        },
        togglePasswordLoginVisibility() {
            this.isPasswordLoginVisible = !this.isPasswordLoginVisible;
        }
    },
    watch: {
        isUserModalOpen(newValue) {
            this.$nextTick(() => {
                const modal = document.querySelector('.modal');
                if (modal) {
                    modal.style.visibility = newValue ? 'visible' : 'hidden'; 
                }
            });
        },
        isLogInModalOpen(newValue) {
            this.$nextTick(() => {
                const modal = document.querySelector('.modal');
                if (modal) {
                    modal.style.visibility = newValue ? 'visible' : 'hidden'; 
                }
            });
        },
    }
});