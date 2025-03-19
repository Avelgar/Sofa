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
                window.location.href = '/public/Sofa.html';
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
                        window.location.href = '/public/Sofa.html';
                    } else {
                        console.error("Ошибка при выходе:", response.statusText);
                    }
                })
                .catch(error => {
                    console.error("Ошибка при выходе:", error);
                });
                window.location.href = '/public/Sofa.html';
            }
        })
        .catch(error => {
            window.location.href = '/public/Sofa.html';
            console.error("Ошибка при авторизации:", error);
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
        goods: [],
        isMouseDownOnModal: false,
        isMouseDownOnBackdrop: false,
        isExitModalOpen: false,
        isProductModalOpen: false,
        selectedProduct: {},
        quantity: 1
    },
    mounted() {
        this.fetchGoods();
    },
    methods: {
        handleMouseDown(event) {
            if (event.target === event.currentTarget) {
                this.isMouseDownOnBackdrop = true;
            }
        },
        handleMouseUp(event) {
            if (this.isMouseDownOnBackdrop && event.target === event.currentTarget) {
                if (this.isExitModalOpen) {
                    this.closeExitModal();
                }
                else if (this.isProductModalOpen) {
                    this.closeProductModal();
                }
            }
            this.isMouseDownOnBackdrop = false;
        },
        fetchGoods() {
            fetch('/api/getgoods')
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Ошибка: ${response.status} ${response.statusText} - ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                this.goods = data; // Сохраняем данные в массив
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
        },
        openProductModal(good) {
            this.selectedProduct = good; // Сохраняем выбранный товар
            this.quantity = good.min_order_quantity; // Устанавливаем минимальное количество
            this.isProductModalOpen = true; // Открываем модальное окно
        },
        closeProductModal() {
            this.isProductModalOpen = false; // Закрываем модальное окно
        },
        addToCart() {
            // Логика для добавления товара в корзину
            console.log(`Добавлено ${this.quantity} шт. товара: ${this.selectedProduct.name}`);
            this.closeProductModal(); // Закрываем модальное окно
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
        isProductModalOpen(newValue) {
            this.$nextTick(() => {
                const modal = document.querySelector('.modal');
                if (modal) {
                    modal.style.visibility = newValue ? 'visible' : 'hidden'; 
                }
            });
        },
    }
});