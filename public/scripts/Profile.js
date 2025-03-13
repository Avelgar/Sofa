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

const channel = new BroadcastChannel('auth_channel');

channel.onmessage = (event) => {
    if (event.data === 'logout') {
        window.location.href = '/public/Sofa.html';
    }
};

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
                document.getElementById('username').value = authData.login;
                document.getElementById('email').value = authData.email;
                checkUserFields(authData.login);
            } else {
                handleLogout();
            }
        })
        .catch(error => {
            window.location.href = '/public/Sofa.html';
            console.error("Ошибка при загрузке:", error);
        });
}

function handleLogout() {
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
}

function checkUserFields(login) {
    fetch(`/api/checkUserFields?login=${encodeURIComponent(login)}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Ошибка при получении данных пользователя');
        })
        .then(data => {
            console.log(data);
            if (data.nickname && data.vk) {
                document.getElementById('vk').style.display = 'block';
                document.getElementById('vk_label').style.display = 'block';
                document.getElementById('nickname').style.display = 'block';
                document.getElementById('nickname_label').style.display = 'block';
                document.getElementById('vk').value = data.vk;
                document.getElementById('nickname').value = data.nickname;
            } else {
                document.getElementById('vk').style.display = 'none';
                document.getElementById('nickname').style.display = 'none';
            }
        })
        .catch(error => {
            console.error("Ошибка при проверке полей пользователя:", error);
        });
}
