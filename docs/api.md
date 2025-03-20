# API

**Version:** 1.0.0
**Base URL:** `http://localhost/api`
**Authentication:** Bearer Token (JWT)

---

## 1. All Routes

```
/api/health/	http://localhost:3000/api/health	(GET, HEAD)
/api/login/		http://localhost:3000/api/login		(POST)
/api/profile/	http://localhost:3000/api/profile	(POST)
/api/signup/	http://localhost:3000/api/signup	(POST)
/api/verify/	http://localhost:3000/api/verify	(GET, HEAD)
```

## 1. Health Check

Check if the API and database are running.

### **Endpoint**

```http
GET /api/health
```

### **Response**

````

## **Response**
```json
{
    "status": "ok",
    "db": "connected",
    "backups": "present" | "missing"
}
````

---

## **2. Authentication**

Handles user sign-up, login, and profile retrieval.

### **Sign Up**

Create a new user account.

#### **Endpoint**

```http
POST /api/signup
```

#### **Request Body**

```json
{
	"username": "exampleUser",
	"email": "user@example.com",
	"password": "securepassword"
}
```

#### **Response**

```json
{
	"message": "User registered successfully",
	"userId": "123456"
}
```

---

### **Login**

Authenticate a user and return a JWT token.

#### **Endpoint**

```http
POST /api/login
```

#### **Request Body**

```json
{
	"email": "user@example.com",
	"password": "securepassword"
}
```

#### **Response**

```json
{
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"expiresIn": 3600
}
```

---

### **Verify Token**

Check if a JWT token is valid.

#### **Endpoint**

```http
GET /api/verify
```

#### **Headers**

```http
Authorization: Bearer {token}
```

#### **Response**

```json
{
	"valid": true
}
```

---

### **Get Profile**

Retrieve the authenticated user's profile.

#### **Endpoint**

```http
GET /api/profile
```

#### **Headers**

```http
Authorization: Bearer {token}
```

#### **Response**

```json
{
	"userId": "123456",
	"username": "exampleUser",
	"email": "user@example.com"
}
```

---

## **3. Static File Access**

Serves static files from specific directories.

### **Admin Files**

Retrieve admin files from `/admin/` directory.

#### **Endpoint**

```http
GET /admin/{file}
```

#### **Example**

```http
GET /admin/dashboard.html
```

---

### **Documentation Files**

Retrieve documentation files from `/docs/` directory.

#### **Endpoint**

```http
GET /docs/{file}
```

#### **Example**

```http
GET /docs/api-docs.pdf
```

---

### **Public Assets**

Retrieve public assets from `/public/` directory.

#### **Endpoint**

```http
GET /public/{file}
```

#### **Example**

```http
GET /public/logo.png
```

---

### **User Uploads**

Retrieve uploaded user files from `/uploads/` directory.

#### **Endpoint**

```http
GET /uploads/{file}
```

#### **Example**

```http
GET /uploads/user-avatar.jpg
```

#### **Response**

Returns the requested file if it exists.

---

### **Restrictions**

-   If `ALLOW_UPLOADS=false`, the `/uploads/` route will return a `403 Forbidden` response.

```json
{
	"error": "Uploads are disabled."
}
```
