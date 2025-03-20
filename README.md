# ShoutShack

---

## 📜 License

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](./LICENSE) file for details.

---

## Content

-   ### [Introduction](#1-introduction)
-   ### [Goals](#2-goals)
-   ### [State of the Project](#3-state-of-the-project)
-   ### [Authors](#4.-authors)

<br>

---

## 1. Introduction

The goal of this project is to create a web application that blends the vibe, creativity, and freedom of old guestbooks, forums, and pre-Facebook social media with modern features and accessibility. I will advocate for users' right to privacy and control over their data while doing my due dilligence to maintain the security of the data they have chosen to share.

The end goal is to have a warm and friendly community that openly accepts people from all walks of life with a heightened freedom of expression. Instead of the simple profile forms you may see now, I'll give users an entire ShoutBook (guestbook) page they can customize to their heart's content. In its early stages, most if not all HTML and CSS customizability will be available to the end user in their sandboxed ShoutBook page.

<br>

The project stack includes the following

<br>

-   TypeScript
-   HTML
-   CSS
-   Node.js
-   Fastify
-   Postgres
-   HashiCorp Vault
-   Docker

-   TypeScript and JavaScript globally adhere to ES2022 and ES Modules syntax.

<br>

---

## 2. Goals

-   1. To give users a more interactive and customizable experience than 123guestbook provided while staying true to the spirit of the small web

    -   I loved 123guestbook while I had one, but why not expand on what they did and what other guestbook services have done? I want more options and control for the users that want it, while maintaining simpler configurations for users that want more of a set-and-forget experience.

-   2. To respect the privacy and agency of users and the data they choose to share

    -   I am a strong privacy advocate and want to create the sort of service I wish was the norm. I want to gather and store as little data as is possible for the service to function and for its developers to improve it over time. Under no circumstances will any tracking elements to be added. Third-party scripts, their functionalities, their authors, and why I've chosen to trust them will be explicitly disclosed to the user. No user data will be monetized for any reason whatsoever. Users from any place in the world will be able to export the complete set of data associated with their account as well as request its deletion.

-   3. To treat security as a top priority, with a strong focus on protecting users' data

    -   At every stage of development and maintenance, a strong focus is to be placed on the application's security. Argon2id has been chosen for all hashing functionality with the application of user salts and a pepper which will be rotated on a regular basis, which will help encrypt user passwords at rest inside the database.

    -   I plan to encrypt more data stored on the database at rest while keeping encryption keys stored offline in a secure manner.

<br>

---

## 3, State of the Project

<br>

03/16/2025 - After a several month hiatus, I'm now a week into a 3rd refactor. I've learned a good deal about project and server architecture and am already having a much better development experience getting the basics implemented and working.
<br>

---

## 4. Authors

-   ### **Viihna Lehraine**

    -   **_Developer and Initial Author_**

    -   **_[viihna@ViihnaTech.com](mailto:viihna@viihnatech.com)_**

    -   GPG - _[[Email Key]](.keys/gpg/viihna@viihnatech.com_email_key.asc)_ || _[[Encryption Key]](.keys/gpg/viihna@viihnatech.com_encryption_key.asc)_ || _[[Signing Key]](.keys/gpg/viihna@viihnatech.com_signing_key.asc)_

<br>

---
