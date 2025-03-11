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

    Authenticate();
});


function Authenticate() {
    fetch('/api/authenticate')
        .then(response => {
            if (!response.ok) {
                console.log(response);
                // window.location.href = '/public/Sofa.html';
            }
            return response.json();
        })
        .then(authData => {
            if (authData && authData.success) {
                
            } else {
                fetch('/api/logout', {
                    method: 'POST',
                })
                .then(response => {
                    if (response.ok) {
                        channel.postMessage('logout');
                        //window.location.href = '/public/Sofa.html';
                    } else {
                        console.error("Ошибка при выходе:", response.statusText);
                    }
                })
                .catch(error => {
                    console.error("Ошибка при выходе:", error);
                });
                //window.location.href = '/public/Sofa.html';
            }
        })
        .catch(error => {
            window.location.href = '/public/Sofa.html';
            console.error("Ошибка при загрузке монет:", error);
        });
}

const channel = new BroadcastChannel('auth_channel');

channel.onmessage = (event) => {
    if (event.data === 'logout') {
        window.location.href = '/public/Sofa.html';
    }
};

new Vue({
    el: '#app',
    data: {
        isMouseDownOnModal: false,
        isMouseDownOnBackdrop: false,
        isExitModalOpen: false,
    },
    methods: {
        handleMouseDown(event) {
            if (event.target === event.currentTarget) {
                this.isMouseDownOnBackdrop = true;
            }
        },
        handleMouseUp(event) {
            if (this.isMouseDownOnBackdrop && event.target === event.currentTarget) {
                    this.closeExitModal();
            }
            this.isMouseDownOnBackdrop = false;
        },
        openExitModal() {
            this.isExitModalOpen = true;
        },
        submitExitForm() {
            fetch('/api/logout', {
                method: 'POST',
            })
            .then(response => {
                if (response.ok) {
                    channel.postMessage('logout');
                    window.location.href = '/public/Sofa.html';
                } else {
                    console.error("Ошибка при выходе:", response.statusText);
                }
            })
            .catch(error => {
                console.error("Ошибка при выходе:", error);
            });
        },
        closeExitModal() {
            this.isExitModalOpen = false;
        }
    },
    watch: {
        isExitModalOpen(newValue) {
            this.$nextTick(() => {
                const modal = document.querySelector('.modal');
                if (modal) {
                    modal.style.visibility = newValue ? 'visible' : 'hidden'; 
                }
            });
        },
    }
});