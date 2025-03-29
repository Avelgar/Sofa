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
                // Здесь может быть логика, если авторизация успешна
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
        quantity: 1,
        uploadedFile: null,
    },
    mounted() {
        this.fetchGoods();
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
                console.log(data);
                this.goods = data;
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
        checkFileFormat(event, good) {
            const file = event.target.files[0];
            if (file) {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                // Проверка формата файла на основе значения maket_format
                if ((good.maket_format === "jpg" && fileExtension !== "jpg") ||
                    (good.maket_format === "png" && fileExtension !== "png")) {
                    this.showNotification('Неверный формат файла! Ожидается ' + good.maket_format.toUpperCase(), 'error');
                    event.target.value = ''; // Сбросить поле ввода
                }
                this.uploadedFile = file;
            }
        },
        validateCartData() {
            const isQuantityValid = this.quantity >= this.selectedProduct.min_order_quantity &&
                                    this.quantity % this.selectedProduct.multiplicity === 0;
            
            // Проверка на необходимость прикрепления файла
            const isFileValid = !this.selectedProduct.need_maket || (this.selectedProduct.need_maket && this.uploadedFile !== null);
        
            return isQuantityValid && isFileValid; // Возвращаем true только если оба условия выполняются
        },
        addToCart() {
            if (this.validateCartData()) {
                const formData = new FormData();
                formData.append('article', this.selectedProduct.article);
                formData.append('quantity', this.quantity);
        
                if (this.selectedProduct.need_maket) {
                    formData.append('file', this.uploadedFile); // Добавляем файл изображения
                }
        
                fetch('/api/addToCart', {
                    method: 'POST',
                    body: formData,
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка при добавлении товара в корзину');
                    }
                    return response.json();
                })
                .then(data => {
                    this.showNotification('Товар добавлен в корзину!', 'success');
                    this.closeProductModal();
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    this.showNotification('Ошибка при добавлении товара в корзину', 'error');
                });
            } else {
                if (this.selectedProduct.need_maket && !this.uploadedFile) {
                    this.showNotification('Необходимо прикрепить файл для этого товара.', 'error');
                } else {
                    this.showNotification('Количество должно быть больше минимального и делиться на шаг.', 'error');
                }
            }
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
        }
    }
});
