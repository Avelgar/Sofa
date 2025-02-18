package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"	
	"strings"

	_ "github.com/lib/pq"
)

type User struct {
	Login              string     `json:"login"`
	Email              string     `json:"email"`
	Password           string     `json:"password"`
	IsBanned           bool       `json:"is_banned"`
	nickname           *string     `json:"nickname"`
	author_vk          *string     `json:"author_vk"`
}

var db *sql.DB

func initDB() {
	var err error
	connStr := "postgres://postgres:12345@localhost:5432/sofa?sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
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

	var existingUser  User
	err = db.QueryRow("SELECT login, email FROM users WHERE email = $1", user.Email).Scan(&existingUser .Login, &existingUser .Email)
	if err == nil {
			http.Error(w, "UserAlreadyWithEmail", http.StatusConflict)
		return
	} else if err != sql.ErrNoRows {
		log.Println("Ошибка при проверке существующего пользователя по email:", err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT login, email FROM users WHERE login = $1", user.Login).Scan(&existingUser .Login, &existingUser .Email)
	if err == nil {
		http.Error(w, "UserAlreadyExistsWithLogin", http.StatusConflict)
		return
	} else if err != sql.ErrNoRows {
		log.Println("Ошибка при проверке существующего пользователя по логину:", err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

	user.IsBanned = false
	user.nickname = nil
	user.author_vk = nil

	_, err = db.Exec("INSERT INTO users (login, email, password, is_banned, nickname, author_vk) VALUES ($1, $2, $3, $4, $5, $6)",
	user.Login, user.Email, user.Password, user.IsBanned, user.nickname, user.author_vk)
	if err != nil {
		log.Println("Ошибка при вставке пользователя в базу данных:", err)
		http.Error(w, "UserAlreadySignUp", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

func SignUpAuthorHandler(w http.ResponseWriter, r *http.Request) {
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

	var existingUser  User
	err = db.QueryRow("SELECT login, email FROM users WHERE email = $1", user.Email).Scan(&existingUser .Login, &existingUser .Email)
	if err == nil {
			http.Error(w, "UserAlreadyWithEmail", http.StatusConflict)
		return
	} else if err != sql.ErrNoRows {
		log.Println("Ошибка при проверке существующего пользователя по email:", err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT login, email FROM users WHERE login = $1", user.Login).Scan(&existingUser .Login, &existingUser .Email)
	if err == nil {
		http.Error(w, "UserAlreadyExistsWithLogin", http.StatusConflict)
		return
	} else if err != sql.ErrNoRows {
		log.Println("Ошибка при проверке существующего пользователя по логину:", err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT login, email FROM users WHERE nickname = $1", user.nickname).Scan(&existingUser .Login, &existingUser .Email)
	if err == nil {
		http.Error(w, "UserAlreadyExistsWithNickname", http.StatusConflict)
		return
	} else if err != sql.ErrNoRows {
		log.Println("Ошибка при проверке существующего пользователя по никнейму:", err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT login, email FROM users WHERE author_vk = $1", user.author_vk).Scan(&existingUser .Login, &existingUser .Email)
	if err == nil {
		http.Error(w, "UserAlreadyExistsWithauthor_vk", http.StatusConflict)
		return
	} else if err != sql.ErrNoRows {
		log.Println("Ошибка при проверке существующего пользователя по author_vk:", err)
		http.Error(w, "InternalServerError", http.StatusInternalServerError)
		return
	}

	user.IsBanned = false

	_, err = db.Exec("INSERT INTO users (login, email, password, is_banned, nickname, author_vk) VALUES ($1, $2, $3, $4, $5, $6)",
	user.Login, user.Email, user.Password, user.IsBanned, user.nickname, user.author_vk)
	if err != nil {
		log.Println("Ошибка при вставке пользователя в базу данных:", err)
		http.Error(w, "UserAlreadySignUp", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
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
		query = "SELECT login, email, password, is_banned, nickname, author_vk FROM users WHERE email = $1"
		err = db.QueryRow(query, user.Login).Scan(&storedUser .Login, &storedUser .Email, &storedUser .Password, &storedUser .IsBanned, &storedUser .nickname, &storedUser .author_vk)
	} else {
		query = "SELECT login, email, password, is_banned, nickname, author_vk FROM users WHERE login = $1"
		err = db.QueryRow(query, user.Login).Scan(&storedUser .Login, &storedUser .Email, &storedUser .Password, &storedUser .IsBanned, &storedUser .nickname, &storedUser .author_vk)
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

	if storedUser .IsBanned {
		http.Error(w, "UserIsBanned", http.StatusForbidden)
		return
	}

	if storedUser .Password != user.Password {
		http.Error(w, "InvalidCredentials", http.StatusUnauthorized)
		return
	}	

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
}


func main() {
	initDB()
	defer db.Close()
	
	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("./public"))))


	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/public/Sofa.html", http.StatusFound)
	})

	http.HandleFunc("/SignUpAuthor", SignUpAuthorHandler)
	http.HandleFunc("/SignUpUser", SignUpUserHandler)
	http.HandleFunc("/LogIn", logInHandler)

	// fmt.Println("Сервер запущен на http://localhost:8080")
	fmt.Println("Сервер запущен на https://46k2wbxg-8080.euw.devtunnels.ms/")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
