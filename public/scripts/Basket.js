// Функция для удаления товара из корзины
function removeFromBasket(itemId) {
    fetch(`/api/removeFromBasket/${itemId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при удалении товара из корзины');
        }
        // Обновляем корзину после удаления
        updateBasket();
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
}

// Функция для обновления корзины
function updateBasket() {
    fetch('/api/getBasketItems', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при получении товаров из корзины');
        }
        return response.json();
    })
    .then(data => {
        const basketItemsDiv = document.getElementById('basket-items');
        basketItemsDiv.innerHTML = ''; // Очистка контейнера перед добавлением новых элементов

        if (data.length === 0) {
            basketItemsDiv.innerHTML = '<p>Ваша корзина пуста.</p>';
        } else {
            let totalPrice = 0; // Переменная для хранения общей стоимости
            data.forEach(item => {
                const itemDiv = document.createElement('div');
                const itemPrice = item.price * item.quantity; // Общая стоимость для этого товара
                totalPrice += itemPrice; // Добавляем к общей стоимости

                itemDiv.innerHTML = `
                    <h2>Товар: ${item.name}</h2>
                    <p>Количество: ${item.quantity}</p>
                    <p>Цена: ${item.price} ₽</p>
                    <p>Итого: ${itemPrice} ₽</p>
                    ${item.image_data ? `<img src="data:image/png;base64,${item.image_data}" alt="${item.article}" style="max-width: 200px;"/>` : ''}
                    <button onclick="removeFromBasket(${item.id})">Удалить из корзины</button>
                `;
                basketItemsDiv.appendChild(itemDiv);
            });

            // Кнопка для оплаты
            const totalDiv = document.createElement('div');
            totalDiv.innerHTML = `<h3>Общая стоимость: ${totalPrice} ₽</h3>
                                  <button onclick="payForItems()">Оплатить</button>`;
            basketItemsDiv.appendChild(totalDiv);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        document.getElementById('basket-items').innerHTML = '<p>Ошибка при загрузке корзины.</p>';
    });
}

// Инициализация корзины при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
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
    updateBasket();
});


// Функция для оплаты товаров
function payForItems() {
    fetch('/api/payForItems', {
        method: 'POST',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при оплате');
        }
        alert('Оплата прошла успешно!');
        // Можно перенаправить на страницу подтверждения оплаты или очистить корзину
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
}
