<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).


## ADMIN
👤 Admin CRUD AUTH
✅ DTO va entity to‘liq validatsiyalangan (class-validator)
🔐 RoleGuard va rate limit bilan himoyalangan
🔄 JWT token va cookie asosida autentifikatsiya
📄 Swagger bilan hujjatlashtirilgan
✉️ Email orqali faollashtirish linki yuboriladi
💾 Transactionlar, xashlangan token/parollar ishlatilgan

## CAR
🚗 Car CRUD
✅ DTO va entity to‘liq validatsiyalangan (class-validator)
🔐 RoleGuard va UserCategoryGuard bilan himoyalangan
🔄 Driver mavjudligi tekshiriladi
📄 Swagger bilan hujjatlashtirilgan
💾 TypeORM orqali xavfsiz CRUD amallar bajariladi

## CHAT MESSAGE
💬 Chat xabarlar uchun CRUD  
✅ DTO va entity validatsiyalangan (class-validator)  
🔐 RoleGuard va UserCategoryGuard bilan himoyalangan  
🔗 Ride bilan bog‘liq, mavjudligi tekshiriladi  
📄 Swagger bilan hujjatlashtirilgan  
💾 TypeORM orqali yozuvlar saqlanadi

## CLIENT PAYMENT CARD
💳 Client kartalarini qo‘shish, yangilash va boshqarish
✅ DTO va entity to‘liq validatsiyalangan (class-validator, Swagger)
🔐 RoleGuard va UserCategoryGuard bilan himoyalangan
🔄 Default karta holati boshqariladi
📄 Swagger bilan hujjatlashtirilgan
💾 TypeORM orqali transactionga tayyor CRUD amallar

## CLIENT SESSION
🧾 Client session CRUD  
✅ DTO va entity to‘liq validatsiyalangan  
🔐 Client uchun RoleGuard va UserCategoryGuard qo‘llangan  
🔄 Refresh tokenlar, qurilma ma’lumotlari bilan ishlash  
📄 Swagger bilan hujjatlashtirilgan

## DAILY STATS
📊 Statistikani saqlovchi modul (kunlik)
✅ CRUD, Swagger hujjatlari to‘liq
🔗 ServiceArea bilan `ManyToOne` aloqasi bor
♻️ Duplicate kiritishni `@Unique` orqali cheklaydi

## DRIVER EARNINGS
💰 Haydovchilarning daromadlari CRUD
✅ DTO va entity class-validator va Swagger bilan validatsiyalangan
🔐 RoleGuard va UserCategoryGuard bilan faqat driver huquqi
🔄 Har bir ride uchun yagona daromad yozuvi kafolatlanadi
📄 Swagger hujjatlari bilan to‘liq hujjatlashtirilgan
💾 TypeORM orqali driver va ride bilan bog‘langan saqlash amallari


## DRIVER PAYMENT CARDS
💳 Haydovchi to‘lov kartalari CRUD
✅ DTO va entity validatsiya qilingan (class-validator, Swagger)
🔐 Faqat driver roliga ruxsat berilgan (RoleGuard, UserCategoryGuard)
📄 Swagger hujjatlari mavjud, barcha maydonlar to‘liq ta'riflangan

## DRIVER PAYOUTS
💸 Driver payout CRUD
✅ DTO va entity Swagger va class-validator bilan to‘liq validatsiyalangan
🔐 RoleGuard va UserCategoryGuard bilan faqat driver roli uchun himoyalangan
🔄 Driver mavjudligi tekshiriladi
📄 Swagger hujjati bilan to‘liq integratsiya
💾 Transaction-like mantiqda ishlaydi (create/update/delete uchun tekshiruvlar mavjud)

## DRIVER SESSION
🔐 Driver sessiyalarini yaratish, yangilash, o‘chirish
✅ DTO va Entity class-validator va Swagger bilan validatsiyalangan
👤 Driver mavjudligi tekshiriladi (create paytida)
🔒 Himoya: RoleGuard, UserCategoryGuard va faqat driver roli
📄 Swagger hujjatlari to‘liq kiritilgan
🧠 Mantiqiy update va delete tekshiruvlar bilan to‘ldirilgan

## NOTIFICATIONS
📣 Real-time va rejalashtirilgan bildirishnomalar
🧠 Push, SMS, Email orqali yuboriladi (client/driver)
📦 Bull + Cron orqali avtomatik yuborish
📡 Socket.IO orqali real-time notification
🧾 Swagger bilan to‘liq hujjatlashtirilgan
🔐 Guard va Role bilan himoyalangan
✅ Mass yuborish (client/driver)
✅ O‘qilgan deb belgilash va hisoblash
✅ DTO va entity validatsiyalangan
✅ Queue, enum, loglar bilan boyitilgan

## PAYMENTS
💳 To‘lov CRUD operatsiyalari
✅ DTO va entity validatsiyalangan
🔐 Faqat `admin`, `super_admin` rollariga ruxsat
📄 Swagger hujjatlari yozilgan
🔄 Ride va ClientPaymentCard bilan to‘g‘ri aloqalar

## PROMO CODE
🏷️ Promo kodlar uchun CRUD operatsiyalar
✅ DTO va entity class-validator bilan validatsiyalangan
🔐 Faqat admin va super_admin rollariga ruxsat berilgan
📄 Swagger hujjatlari bilan hujjatlashtirilgan
⚠️ Mavjud kodlar ustida tekshiruvlar (duplicate check) mavjud

## PROMO CODE USAGE
🎟️ Promo kodlar ishlatilishini kuzatuvchi modul
✅ DTO va entity class-validator bilan validatsiyalangan
🔐 Faqat admin va super_admin rollari uchun ruxsat
📄 Swagger hujjatlari bilan to‘liq hujjatlashtirilgan
⚠️ Topilmagan holatlar uchun NotFoundException ishlatilgan

## RATING
⭐ Client → Driver reyting berish moduli
✅ DTO va entity validatsiyalangan
🚫 Ride uchun bitta reytingdan ko‘p qo‘yish mumkin emas
🔐 Faqat admin va super_admin kirishi mumkin
📄 Swagger hujjatlari bilan to‘liq hujjatlashtirilgan

## RIDESERVICE
🚕 Ride yaratish, haydovchi qidirish va ride jarayonlarini boshqaradi  
🛡️ Redis + PostgreSQL bilan holatlarni saqlaydi  
🔄 Real-time Socket.IO orqali notify  
📊 Prometheus bilan monitoring (histogram, counter)  
🧠 Circuit breaker va rate limiter integratsiyasi  
🔧 ENV orqali sozlanadi (`RIDE_LOCK_TTL_MS`, `CB_FAILURE_THRESHOLD`, va boshqalar)

## SERVICE AREAS
🌍 Hududlar (xizmat ko‘rsatish zonalari) CRUD boshqaruvi
✅ DTO va entity to‘liq validatsiyalangan
🔐 RoleGuard bilan himoyalash qo‘llab-quvvatlanadi
📄 Swagger bilan hujjatlashtirilgan
🔗 Tariff va DailyStats bilan relations ishlatilgan
💾 Topilgan ma’lumotlar ID asosida tekshiriladi, mavjud bo‘lmasa NotFoundException qaytadi

## SUPPORT TICKETS
🎫 Support ticketlar CRUD
✅ DTO’lar bilan to‘liq validatsiya (ride bog‘lanishi tekshiriladi)
🔗 Har bir ticket — ixtiyoriy ride_id bilan, ride mavjud bo‘lmasa NotFoundException
🚫 Bitta ride uchun faqat bitta ochiq ticket (duplicate uchun BadRequestException)
🆔 ticket_number avtomatik generatsiya qilinadi (TCKT-…)
🔐 RoleGuard & UserCategoryGuard bilan faqat admin/super_admin kirishi mumkin
📄 Swagger annotatsiyalari bilan hujjatlashtirilgan

## TARIFFS
💰 Tariff’lar CRUD boshqaruvi
✅ DTO’lar bilan to‘liq validatsiya (car_type, rates va service_area tekshiriladi)
🔗 Har bir tariff “ServiceArea” bilan bog‘lanadi, mavjud bo‘lmasa NotFoundException
📄 Swagger annotatsiyalari: request/response hujjatlashtirilgan
🔐 RoleGuard & UserCategoryGuard bilan faqat admin/super_admin ruxsati
📑 findAll()–da service_area relation, so‘rov orderBy(created_at DESC) bilan qaytadi
🛠️ update() va remove() simple TypeORM operatsiyalari orqali amalga oshiriladi

## CLIENT, DRIVER
👤 CRUD: create, findAll, findOne, update, remove (BadRequestException bilan)
📲 OTP yollash & tekshirish: sendOtp → yuborish, verifyOtpAndAuth → autentifikatsiya/ro‘yxatdan o‘tish
🔑 JWT auth: access & refresh token, refresh bazada hash, HTTP-only cookie
🔄 Token yangilash: eski refresh tekshiradi, yangisini yaratadi, cookie yangilanadi
🚪 Logout: refresh tozalaydi, cookie o‘chiradi
⚙️ ENV konfiguratsiya: CLIENT_REFRESH_TOKEN_KEY, CLIENT_ACCESS_TOKEN_KEY, COOKIE_TIME va boshqalar