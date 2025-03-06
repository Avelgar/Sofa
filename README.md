# Инструкция по установке Проекта:
1. Скачать папку с проектом и разархивировать его в удобное для вас место
2. Скачать PostgreSQL с официального сайта https://www.postgresql.org/download/
3. Запустить установищик PostgreSQL.
   
3.1 Установить на диск с проектом(желательно)

3.2 При установке поставить галочку рядом с pgAdmin 4

3.4 Убедиться, что порт для установки:
```
5432
```
3.3 В качестве логина и пароля использовать(если берете другой логин и пароль то следующие шаги могут работать некорректно)

Логин
```
postgres
```
Пароль
```
12345
```
3.4 Stack Builder для работы не требуется!

4. Написать в поиске компьютера
```
CMD
```
5. Открыть Command Promt и написать следующую команду
```
psql -U postgres
```
> Вы должны увидеть что теперь работаете с postgres, если нет, то попробуйте написать в Command Promt следующую команду
> ```
> pg_ctl -D "C:\Program Files\PostgreSQL\<версия>\data" start
> ```
6. В Command Promt написать следующую команду
```
CREATE DATABASE sofa;
```
7. Перезапустите CMD и напишите следующую команду
```
psql -U postgres -d sofa
```
8. В Command Promt написать следующую команду
```
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    is_banned BOOLEAN DEFAULT FALSE,
    nickname TEXT,
    vk TEXT,
    sign_up_token VARCHAR(255),
    sign_up_token_del_time TIMESTAMP,
    recovery_token VARCHAR(255),
    recovery_token_del_time TIMESTAMP
);
```
8.1 В Command Promt написать следующую команду
```
CREATE TABLE goods (
    id SERIAL PRIMARY KEY,          
    name VARCHAR(255) NOT NULL,     
    price DECIMAL(10, 2) NOT NULL,  
    photo VARCHAR(255),
    article VARCHAR(255) NOT NULL,
    size VARCHAR(50) NOT NULL,
    material VARCHAR(100) NOT NULL,
    min_order_quantity INT NOT NULL,
    multiplicity INT NOT NULL,
    description TEXT NOT NULL          
);
```
8.2 В Command Promt написать следующую команду
```
INSERT INTO goods (name, price, photo, article, size, material, min_order_quantity, multiplicity, description) VALUES ('Футболка', 19.99, 'https://cdn1.ozone.ru/s3/multimedia-4/c600/6545345860.jpg', 'TSHIRT001', 'M', 'Хлопок 100%', 10, 5, 'Мягкая и дышащая футболка для повседневной носки.'), ('Джинсы', 49.99, 'https://i.pinimg.com/736x/d3/3c/54/d33c541e21d5b3ac97738d4f5e025d7c.jpg', 'JEANS002', 'L', 'Деним 98%, Эластан 2%', 5, 2, 'Классические синие джинсы с удобным кроем.'), ('Кроссовки', 89.99, 'https://cdn1.ozone.ru/s3/multimedia-1-w/6979871804.jpg', 'SNEAKERS003', '42', 'Текстиль, резина', 3, 1, 'Легкие и удобные кроссовки для спорта и повседневной носки.'), ('Рюкзак', 39.99, 'https://avatars.mds.yandex.net/i?id=e9f271c41c545d9f3077644a44db3773_l-10242163-images-thumbs&n=13', 'BACKPACK004', 'Универсальный', 'Полиэстер 100%', 2, 1, 'Стильный и вместительный рюкзак с несколькими отделениями.'), ('Часы', 129.99, 'https://avatars.mds.yandex.net/i?id=01eb045da1ed7ff4cb50b2b9f7849b26_l-12445014-images-thumbs&n=13', 'WATCH005', 'Стандарт', 'Нержавеющая сталь, кожа', 1, 1, 'Элегантные наручные часы с кожаным ремешком.');
```

9. В Command Promt написать следующую команду и закрыть Command Promt
```
/q
```
10. Открыть приложение pgAdmin 4.
11. Найти базу данных sofa в выпадающем списке слева и развернуть её -> развернуть Schemas -> развернуть public -> развернуть Tables
12. Найти users и нажать пкм -> View/Edit Data -> All Rows -> В окне справа появится таблица, обновляйте её видимость с помощью View/Edit Data.
> Если у вас возникла проблема то попробуйте перечитать инструкцию, проверить версию PostgreSQL
> ```
> psql --version
> ```
> или проверить переменную PATH
> Открой панель управления -> "Система и безопасность" -> "Система" -> "Дополнительные параметры системы" -> "Переменные среды" -> Найдите переменную Path в разделе "Системные переменные" и нажмите "Изменить". -> Добавьте новый путь к папке bin PostgreSQL и сохраните изменения(Если его там нет).
> ```
> C:\Program Files\PostgreSQL\<версия(например 14)>\bin
> ```
13. Скачать GO с официального сайта https://go.dev/dl/
14. Запустить установищик GO и установить на диск с проектом
15. Открыть vs code
16. Открыть в vs code папку с проектом(File -> Open Folder)
17. Открыть терминал(убедитесь, что путь в терминале ведет к папке с проектом)
18. Написать команду в терминале
```
go version
```
> Вы должны увидеть версию GO, например go version go1.23.4 windows/amd64
19. Написать команду в терминале
```
go mod init server.go
```
> Создает go.mod
20. Написать команду в терминале
```
go get github.com/lib/pq
go get github.com/gorilla/sessions
```
> Создает go.sum

21. Написать команду в терминале
```
go run server.go
```
> Запускает проект
22. Перейти во вкладку ports рядом с терминалом
23. Нажать Forward a Port
24. Написать в поле Port
```
8080
``` 
25. Нажать Enter
26. Перейти по ссылке предоставленной в Forwarded Address

Если у вас возникли проблемы с установкой, то перечитайте инструкцию, спросите чат гпт или напишите Кириллу(В крайнем случае).
