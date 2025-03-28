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
        selectedColor: '',
        cmykColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        pantoneColors: ['#F6EB61', '#D7A3D2', '#EAB8B1', '#F78DA7'],
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
            this.selectedColor = ''; // Сбрасываем выбранный цвет
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
        updateColorOptions() {
            const product = this.selectedProduct; 
            if (product) {
                if (product.color_profile === 'RGB') {
                    this.colorOptions = ['#FF0000', '#00FF00', '#0000FF'];
                } else if (product.color_profile === 'CMYK') {
                    this.colorOptions = ['0,0,0,0', '0,100,100,0'];
                } else if (product.color_profile === 'Pantone') {
                    this.colorOptions = ['Pantone 123C', 'Pantone 456C'];
                }
            }
        },
        selectColor(color) {
            this.selectedColor = color;
        },
        updateColorDisplay() {
            
        },
        validateCartData() {
            const isQuantityValid = this.quantity >= this.selectedProduct.min_order_quantity &&
                                    this.quantity % this.selectedProduct.multiplicity === 0;
    
            const isColorSelected = this.selectedProduct.need_maket ? this.selectedColor !== '' : true;
    
            return isQuantityValid && isColorSelected;
        },
        addToCart() {
            if (this.validateCartData()) {
                let goodsString = `${this.selectedProduct.article}|${this.quantity}`; // формируем строку для товаров без макетов
                let goodsWithMaketString = '';
        
                if (this.selectedProduct.need_maket) {
                    const file = this.uploadedFile; // Получаем файл
                    const reader = new FileReader();
                    reader.onload = () => {
                        const fileContent = reader.result.split(',')[1]; // Извлекаем только часть Base64 без префикса
                        goodsWithMaketString = `${this.selectedProduct.article}|${this.quantity}|${this.selectedColor}|${fileContent}`;
        
                        // Теперь отправляем данные на сервер
                        fetch('/api/addToCart', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                                goods_with_makets: goodsWithMaketString 
                            }), // Отправляем только товары с макетами
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Ошибка при добавлении товара в корзину');
                            }
                            return response.json();
                        })
                        .then(data => {
                            this.showNotification('Товар добавлен в корзину!', 'success');
                            this.closeProductModal(); // Закрываем модальное окно
                        })
                        .catch(error => {
                            console.error('Ошибка:', error);
                            this.showNotification('Ошибка при добавлении товара в корзину', 'error');
                        });
                    };
        
                    reader.readAsDataURL(file); // Читаем содержимое файла
                } else {
                    // Если макет не нужен, просто отправляем пустую строку
                    fetch('/api/addToCart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            goods: goodsString 
                        }), // Отправляем только товары без макетов
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Ошибка при добавлении товара в корзину');
                        }
                        return response.json();
                    })
                    .then(data => {
                        this.showNotification('Товар добавлен в корзину!', 'success');
                        this.closeProductModal(); // Закрываем модальное окно
                    })
                    .catch(error => {
                        console.error('Ошибка:', error);
                        this.showNotification('Ошибка при добавлении товара в корзину', 'error');
                    });
                }
            } else {
                this.showNotification('Количество должно быть больше минимального и делиться на шаг.', 'error');
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
        selectedProduct(newProduct) {
            this.updateColorOptions();
        },
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
