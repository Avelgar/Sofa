package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"	
    "net/smtp"
	"strings"
    "time"

	"github.com/gorilla/sessions"
	_ "github.com/lib/pq"
)

type User struct {
    Login    string  `json:"login"`
    Email    string  `json:"email"`
    Password string  `json:"password"`
	Nickname string  `json:"nickname"`
	VK string `json:"vk"`
    IsBanned bool    `json:"is_banned"`
    SignUpToken        *string    `json:"sign_up_token"`
	SignUpTokenDelTime *time.Time `json:"sign_up_token_del_time"`
    RecoveryToken      *string    `json:"recovery_token"`
	RecoveryTokenDelTime *time.Time `json:"recovery_token_del_time"`
}

type Good struct {
    Name                 string  `json:"name"`
    Price                float64 `json:"price"` // Изменено на float64 для корректного представления цены
    Photo                string  `json:"photo"`
    Article              string  `json:"article"`              // Добавлено поле article
    Size                 string  `json:"size"`                 // Добавлено поле size
    Material             string  `json:"material"`             // Добавлено поле material
    MinOrderQuantity     int     `json:"min_order_quantity"`   // Добавлено поле min_order_quantity
    Multiplicity         int     `json:"multiplicity"`         // Добавлено поле multiplicity
    Description          string  `json:"description"`          // Добавлено поле description
}




var db *sql.DB
var store = sessions.NewCookieStore([]byte("abcdefg"))

func initDB() {
	var err error
	connStr := "postgres://postgres:12345@localhost:5432/sofa?sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
}

func sendMessageEmail(email, subject, body string) error {
	smtpHost := "smtp.yandex.ru"
	smtpPort := "587"
	username := "s.polo2005@yandex.ru"
	password := "sltsjawwlrauzcfh"

	msg := []byte("From: " + username + "\r\n" +
		"To: " + email + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" +
		body + "\r\n")

	auth := smtp.PlainAuth("", username, password, smtpHost)

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, username, []string{email}, msg)
	if err != nil {
		return fmt.Errorf("Ошибка при отправке: %w", err)
	}

	fmt.Println("Сообщение отправлено:", subject)
	return nil
}

func generateSignUpToken() string {
	return fmt.Sprintf("%x", time.Now().UnixNano())
}

func isPasswordStrong(password string) bool {
	if len(password) < 8 {
		return false
	}
	hasUpper := false
	hasLower := false
	hasDigit := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasDigit = true
		}
	}

	return hasUpper && hasLower && hasDigit
}

func SignUpUserHandler(w http.ResponseWriter, r *http.Request) {
    var user User
    err := json.NewDecoder(r.Body).Decode(&user)
    if err != nil {
        http.Error(w, "Badrequest", http.StatusBadRequest)
        return
    }

    if !isPasswordStrong(user.Password) {
        http.Error(w, "PasswordIsTooWeak", http.StatusBadRequest)
        return
    }

    // Проверка на существование пользователя по email
    var existingUser  User
    err = db.QueryRow("SELECT email, login, sign_up_token FROM users WHERE email = $1", user.Email).Scan(&existingUser .Email, &existingUser .Login, &existingUser .SignUpToken)
    if err == nil {
        if existingUser .SignUpToken == nil {
			http.Error(w, "UserAlreadyExistsWithEmailAndNoToken", http.StatusConflict)
		} else {
			http.Error(w, "UserAlreadyExistsWithEmailAndHasToken", http.StatusConflict)
		}
        return
    } else if err != sql.ErrNoRows {
        log.Println("Error checking existing user by email:", err)
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    // Проверка на существование пользователя по login
    err = db.QueryRow("SELECT login, email FROM users WHERE login = $1", user.Login).Scan(&existingUser .Login, &existingUser .Email)
    if err == nil {
        http.Error(w, "UserAlreadyExistsWithLogin", http.StatusConflict)
        return
    } else if err != sql.ErrNoRows {
        log.Println("Error checking existing user by login:", err)
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    // Проверка на уникальность nickname
    if user.Nickname != "" {
        err = db.QueryRow("SELECT login, nickname FROM users WHERE nickname = $1", user.Nickname).Scan(&existingUser .Login, &existingUser .Nickname)
        if err == nil {
            http.Error(w, "NicknameAlreadyExists", http.StatusConflict)
            return
        } else if err != sql.ErrNoRows {
            log.Println("Error checking existing nickname:", err)
            http.Error(w, "InternalServerError", http.StatusInternalServerError)
            return
        }
    }

    signUpToken := generateSignUpToken()
	user.SignUpToken = &signUpToken
	t := time.Now().Add(time.Hour)
	user.SignUpTokenDelTime = &t

	subject := "Подтверждение Регистрации"
	body := fmt.Sprintf("Пожалуйста, подтвердите вашу регистрацию, перейдя по следующей ссылке: https://46k2wbxg-8080.euw.devtunnels.ms/public/Sofa.html?token=%s", *user.SignUpToken)
	err = sendMessageEmail(user.Email, subject, body)
	if err != nil {
		log.Println("Ошибка при отправке письма:", err)
	}

    user.RecoveryToken = nil
	user.RecoveryTokenDelTime = nil
    user.IsBanned = false

    _, err = db.Exec("INSERT INTO users (login, email, password, is_banned, nickname, vk, sign_up_token, sign_up_token_del_time, recovery_token, recovery_token_del_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        user.Login, user.Email, user.Password, user.IsBanned, user.Nickname, user.VK, user.SignUpToken, user.SignUpTokenDelTime, user.RecoveryToken, user.RecoveryTokenDelTime)
    if err != nil {
        log.Println("Error inserting user into database:", err)
        http.Error(w, "UserAlreadySignUp", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "User  registered successfully"})
}

func cleanUpExpiredTokens() {
	for {
		time.Sleep(time.Minute)

		// Удаляем пользователей с истекшими токенами регистрации
		_, err := db.Exec("DELETE FROM users WHERE sign_up_token_del_time < NOW() AND sign_up_token IS NOT NULL AND sign_up_token <> ''")
		if err != nil {
			log.Println("Ошибка при удалении пользователей с истекшими токенами:", err)
		}

        // Обнуляем токены восстановления для пользователей с истекшим временем
		_, err = db.Exec("UPDATE users SET recovery_token = NULL, recovery_token_del_time = NULL WHERE recovery_token_del_time < NOW() AND recovery_token IS NOT NULL AND recovery_token <> ''")
		if err != nil {
			log.Println("Ошибка при обнулении токенов восстановления:", err)
		}

	}
}

func handleCheckToken(w http.ResponseWriter, r *http.Request) {

    // Получаем токен из тела запроса
    var requestData struct {
        Token string `json:"token"`
    }
    if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil || requestData.Token == "" {
        json.NewEncoder(w).Encode(map[string]string{"error": "NoToken"})
        return
    }

    var user User
    err := db.QueryRow("SELECT login, email FROM users WHERE sign_up_token = $1 AND sign_up_token_del_time > NOW()", requestData.Token).Scan(&user.Login, &user.Email)

    if err != nil {
        if err == sql.ErrNoRows {
            json.NewEncoder(w).Encode(map[string]bool{"success": false})
            return
        }
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    _, err = db.Exec("UPDATE users SET sign_up_token = NULL, sign_up_token_del_time = NULL WHERE sign_up_token = $1", requestData.Token)
    if err != nil {
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func recoveryHandler(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Email string `json:"email"`
	}
	
	// Декодируем JSON из тела запроса
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	var user User
	err = db.QueryRow("SELECT login, email, is_banned, sign_up_token, sign_up_token_del_time, recovery_token, recovery_token_del_time FROM users WHERE email = $1", requestBody.Email).Scan(&user.Login, &user.Email, &user.IsBanned, &user.SignUpToken, &user.SignUpTokenDelTime, &user.RecoveryToken, &user.RecoveryTokenDelTime)
	
	if err == sql.ErrNoRows {
		http.Error(w, "UserNotFound", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}
	
	// Проверка на наличие токена регистрации
	if user.SignUpToken != nil && *user.SignUpToken != "" && user.SignUpTokenDelTime != nil {
		http.Error(w, "UserHasToken", http.StatusForbidden)
		return
	}
	
	// Проверка на забаненность пользователя
	if user.IsBanned {
		http.Error(w, "UserIsBanned", http.StatusForbidden)
		return
	}
	
	// Проверка на наличие токена восстановления
	if user.RecoveryToken != nil && *user.RecoveryToken != "" && user.RecoveryTokenDelTime != nil {
		http.Error(w, "UserHasRecoveryToken", http.StatusForbidden)
		return
	}
	
	// Генерация токена восстановления
	recoveryToken := generateSignUpToken()
	user.RecoveryToken = &recoveryToken
	t := time.Now().Add(time.Hour) // Токен действителен 1 час
	user.RecoveryTokenDelTime = &t
	
	// Обновление пользователя с новым токеном
	_, err = db.Exec("UPDATE users SET recovery_token = $1, recovery_token_del_time = $2 WHERE email = $3", user.RecoveryToken, user.RecoveryTokenDelTime, user.Email)
	if err != nil {
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}
	
	// Отправка письма с ссылкой на восстановление пароля
	subject := "Восстановление пароля"
	body := fmt.Sprintf("Пожалуйста, восстановите ваш пароль, перейдя по следующей ссылке: https://46k2wbxg-8080.euw.devtunnels.ms/public/Recovery.html?recovery_token=%s", *user.RecoveryToken)
	err = sendMessageEmail(requestBody.Email, subject, body)
	if err != nil {
		log.Println("Ошибка при отправке письма:", err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Письмо с ссылкой на восстановление пароля отправлено!"})
}

func confirmRecoveryTokenHandler(w http.ResponseWriter, r *http.Request) {
    var requestData struct {
        RecoveryToken string `json:"recovery_token"`
    }

    // Декодируем JSON-данные из запроса
    if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil || requestData.RecoveryToken == "" {
        http.Error(w, "NoRecoveryToken", http.StatusBadRequest)
        return
    }

    // Проверяем наличие токена в базе данных
    var user User
    err := db.QueryRow("SELECT login FROM users WHERE recovery_token = $1 AND recovery_token_del_time > NOW()", requestData.RecoveryToken).Scan(&user.Login)

    if err != nil {
        if err == sql.ErrNoRows {
            // Если токен не найден, возвращаем ответ с успехом false
            json.NewEncoder(w).Encode(map[string]bool{"success": false})
            return
        }
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    // Если токен действителен, возвращаем ответ с успехом true
    json.NewEncoder(w).Encode(map[string]bool{"success": true})
}


func SubmitRecoveryTokenHandler(w http.ResponseWriter, r *http.Request) {
    var requestBody struct {
        RecoveryPassword string `json:"RecoveryPassword"`
        RecoveryToken    string `json:"recovery_token"`
    }

    // Декодируем JSON-данные из запроса
    err := json.NewDecoder(r.Body).Decode(&requestBody)
    if err != nil || requestBody.RecoveryToken == "" || requestBody.RecoveryPassword == "" {
        http.Error(w, "Bad request", http.StatusBadRequest)
        return
    }

    // Проверяем сложность пароля
    if !isPasswordStrong(requestBody.RecoveryPassword) {
        http.Error(w, "PasswordIsTooWeak", http.StatusBadRequest)
        return
    }

    // Проверяем, существует ли пользователь по токену
    var user User
    err = db.QueryRow("SELECT login FROM users WHERE recovery_token = $1", requestBody.RecoveryToken).Scan(&user.Login)
    if err == sql.ErrNoRows {
        http.Error(w, "UserNotFound", http.StatusNotFound)
        return
    } else if err != nil {
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    // Обновляем пароль в базе данных
    _, err = db.Exec("UPDATE users SET password = $1 WHERE recovery_token = $2", requestBody.RecoveryPassword, requestBody.RecoveryToken)
    if err != nil {
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    // Обнуляем токен и время удаления токена
    _, err = db.Exec("UPDATE users SET recovery_token = NULL, recovery_token_del_time = NULL WHERE recovery_token = $1", requestBody.RecoveryToken)
    if err != nil {
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    // Возвращаем успешный ответ
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Пароль успешно изменен!"})
}

func isEmail(input string) bool {
	return strings.Contains(input, "@") && strings.Contains(input, ".")
}

func logInHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	var storedUser User
	var query string
	if isEmail(user.Login) {
		query = "SELECT login, email, password, is_banned, nickname, sign_up_token, sign_up_token_del_time, recovery_token, recovery_token_del_time FROM users WHERE email = $1"
		err = db.QueryRow(query, user.Login).Scan(&storedUser .Login, &storedUser .Email, &storedUser .Password, &storedUser .IsBanned, &storedUser .Nickname, &storedUser .SignUpToken, &storedUser .SignUpTokenDelTime, &storedUser .RecoveryToken, &storedUser .RecoveryTokenDelTime)
	} else {
		query = "SELECT login, email, password, is_banned, nickname, sign_up_token, sign_up_token_del_time, recovery_token, recovery_token_del_time FROM users WHERE login = $1"
		err = db.QueryRow(query, user.Login).Scan(&storedUser .Login, &storedUser .Email, &storedUser .Password, &storedUser .IsBanned, &storedUser .Nickname, &storedUser .SignUpToken, &storedUser .SignUpTokenDelTime, &storedUser .RecoveryToken, &storedUser .RecoveryTokenDelTime)
	}
	
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "UserNotFound", http.StatusUnauthorized)
			return
		}
		fmt.Println(err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

    if storedUser .SignUpToken != nil && *storedUser .SignUpToken != "" && storedUser .SignUpTokenDelTime != nil {
		http.Error(w, "UserHasToken", http.StatusForbidden)
		return
	}

    if storedUser .RecoveryToken != nil && *storedUser .RecoveryToken != "" && storedUser .RecoveryTokenDelTime != nil {
		http.Error(w, "UserHasRecoveryToken", http.StatusForbidden)
		return
	}

	if storedUser .IsBanned {
		http.Error(w, "UserIsBanned", http.StatusForbidden)
		return
	}

	if storedUser .Password != user.Password {
		http.Error(w, "InvalidCredentials", http.StatusUnauthorized)
		return
	}

	session, _ := store.Get(r, "session-name")
	session.Values["authenticated"] = true
	session.Values["userLogin"] = user.Login
	session.Save(r, w)

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
}

func handleCheckCookie(w http.ResponseWriter, r *http.Request) {
    session, err := store.Get(r, "session-name")
    if err != nil {
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    if authenticated, ok := session.Values["authenticated"].(bool); ok && authenticated {
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
    } else {
        w.WriteHeader(http.StatusUnauthorized)
        json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "User not authenticated"})
    }
}




func handleAuthentication(w http.ResponseWriter, r *http.Request) {
    session, err := store.Get(r, "session-name")
    if err == nil && session.Values["authenticated"] != nil {
        login := session.Values["userLogin"].(string)
        var email string
        err = db.QueryRow("SELECT email FROM users WHERE login = $1", login).Scan( &email)

        if err == nil {
            
            response := map[string]interface{}{
                "success": true,
                "login":   login,
                "email": email,
            }

            json.NewEncoder(w).Encode(response)
            return
        }
    }

    // Если аутентификация не удалась
    json.NewEncoder(w).Encode(map[string]interface{}{"success": false})
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
    // Завершаем сессию
    session, err := store.Get(r, "session-name")
    if err != nil {
        http.Error(w, "InternalServerError", http.StatusInternalServerError)
        return
    }

    // Удаляем сессию
    session.Options.MaxAge = -1 // Устанавливаем MaxAge в -1 для удаления сессии
    session.Values = make(map[interface{}]interface{}) // Очищаем значения сессии
    session.Save(r, w) // Сохраняем изменения

    // Возвращаем успешный ответ
    json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
}

func getgoodsHandler(w http.ResponseWriter, r *http.Request) {
    // Выполняем запрос к таблице goods, выбирая все необходимые поля
    rows, err := db.Query("SELECT name, price, photo, article, size, material, min_order_quantity, multiplicity, description FROM goods")
    if err != nil {
        http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var goods []Good

    // Считываем данные из результата запроса
    for rows.Next() {
        var good Good
        if err := rows.Scan(&good.Name, &good.Price, &good.Photo, &good.Article, &good.Size, &good.Material, &good.MinOrderQuantity, &good.Multiplicity, &good.Description); err != nil {
            http.Error(w, fmt.Sprintf("Scan error: %v", err), http.StatusInternalServerError)
            return
        }
        goods = append(goods, good)
    }

    // Проверяем на ошибки после завершения итерации
    if err := rows.Err(); err != nil {
        http.Error(w, fmt.Sprintf("Rows error: %v", err), http.StatusInternalServerError)
        return
    }

    // Устанавливаем заголовок Content-Type
    w.Header().Set("Content-Type", "application/json")
    
    // Кодируем массив товаров в JSON и отправляем ответ
    if err := json.NewEncoder(w).Encode(goods); err != nil {
        http.Error(w, fmt.Sprintf("Encoding error: %v", err), http.StatusInternalServerError)
        return
    }
}


func handleCheckUserFields(w http.ResponseWriter, r *http.Request) {
    login := r.URL.Query().Get("login")
    if login == "" {
        http.Error(w, "Login is required", http.StatusBadRequest)
        return
    }

    var user User
    err := db.QueryRow("SELECT nickname, vk FROM users WHERE login = $1", login).Scan(&user.Nickname, &user.VK)
    if err != nil {
        if err == sql.ErrNoRows {
            http.Error(w, "User  not found", http.StatusNotFound)
            return
        }
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    response := map[string]interface{}{
        "nickname": user.Nickname,
        "vk":       user.VK,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}



func main() {
	initDB()
	defer db.Close()
	
	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("./public"))))


	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/public/Sofa.html", http.StatusFound)
	})

	http.HandleFunc("/SignUpUser", SignUpUserHandler)
    http.HandleFunc("/api/checkToken", handleCheckToken)
    http.HandleFunc("/Recovery", recoveryHandler)
    http.HandleFunc("/api/confirmRecoveryToken", confirmRecoveryTokenHandler)
	http.HandleFunc("/api/SubmitRecovery", SubmitRecoveryTokenHandler)
	http.HandleFunc("/LogIn", logInHandler)
	http.HandleFunc("/api/checkCookie", handleCheckCookie)
	http.HandleFunc("/api/authenticate", handleAuthentication)
	http.HandleFunc("/api/logout", logoutHandler)
    http.HandleFunc("/api/getgoods", getgoodsHandler)
    http.HandleFunc("/api/checkUserFields", handleCheckUserFields)

	// fmt.Println("Сервер запущен на http://localhost:8080")
	fmt.Println("Сервер запущен на https://46k2wbxg-8080.euw.devtunnels.ms/")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
