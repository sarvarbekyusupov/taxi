import { Controller, Post, Body } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from "@nestjs/swagger";

// --- DTOs for WebSocket Event Documentation ---
// --- WebSocket Hodisalari Hujjatlari uchun DTO'lar ---

class LocationUpdateDto {
  driverId: string;
  lat: number;
  lng: number;
  rideId?: string;
}

class DriverSubscribeDto {
  driverId: string;
}

class RideSubscribeDto {
  rideId: string;
}

class DriversInViewDto {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

// --- Controller for Documentation ---
// --- Hujjatlar uchun Controller ---

@Controller("location-gateway-docs")
@ApiTags("Location Gateway WebSocket")
@ApiBearerAuth()
@ApiHeader({
  name: "x-role",
  description:
    "User role required for connection (e.g., 'driver', 'client') / Ulanish uchun talab qilinadigan foydalanuvchi roli (masalan, 'driver', 'client')",
  required: true,
  enum: ["driver", "client", "admin", "super_admin"],
})
export class LocationGatewayDocsController {
  // === Connection and Authentication Documentation ===
  // === Ulanish va Autentifikatsiya Hujjatlari ===

  @Post("connection-guide")
  @ApiOperation({
    summary: "🔗 WebSocket Connection Guide / WebSocket Ulanish Qo'llanmasi",
    description: `
**English:**
**WebSocket Connection & Authentication**

This guide explains how to connect to the Location Gateway WebSocket server. Authentication is mandatory and role-based.

**1. Install Socket.IO Client:**
\`\`\`bash
npm install socket.io-client
# or
yarn add socket.io-client
\`\`\`

**2. Connect with Authentication:**
You must provide a valid JWT token in the \`Authorization\` header and the user's role in a custom \`x-role\` header.

\`\`\`javascript
import io from 'socket.io-client';

const token = 'your-jwt-token-here';
const userRole = 'driver'; // or 'client', 'admin'

const socket = io('ws://your-server-url', {
  transportOptions: {
    polling: {
      extraHeaders: {
        Authorization: \`Bearer \${token}\`,
        'x-role': userRole
      }
    }
  },
  transports: ['websocket']
});

// Listen for authentication success/error
socket.on('auth:success', (data) => {
  console.log('Authentication successful:', data);
});

socket.on('auth:error', (error) => {
  console.error('Authentication failed:', error.message);
});
\`\`\`

**3. Connection Events:**
- \`connect\`: Fired upon a successful connection.
- \`disconnect\`: Fired when the client is disconnected.
- \`connect_error\`: Fired upon a connection error.

---

**O'zbekcha:**
**WebSocket Ulanish va Autentifikatsiya**

Ushbu qo'llanma Location Gateway WebSocket serveriga qanday ulanishni tushuntiradi. Autentifikatsiya majburiy va rolga asoslangan.

**1. Socket.IO Client'ni o'rnatish:**
\`\`\`bash
npm install socket.io-client
# yoki
yarn add socket.io-client
\`\`\`

**2. Autentifikatsiya bilan ulanish:**
Siz \`Authorization\` sarlavhasida yaroqli JWT tokenini va maxsus \`x-role\` sarlavhasida foydalanuvchi rolini taqdim etishingiz kerak.

\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`

**3. Ulanish Hodisalari:**
- \`connect\`: Muvaffaqiyatli ulanishda ishga tushadi.
- \`disconnect\`: Mijoz uzilganda ishga tushadi.
- \`connect_error\`: Ulanish xatosida ishga tushadi.
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Connection setup guide. / Ulanish qo'llanmasi.",
  })
  connectionGuide() {
    return {
      note_en:
        "This is a guide for connecting to the WebSocket. Use the events documented below in your application.",
      note_uz:
        "Bu WebSocket'ga ulanish uchun qo'llanma. Ilovangizda quyida hujjatlashtirilgan hodisalardan foydalaning.",
    };
  }

  // === Client-to-Server Event Documentation ===
  // === Mijozdan Serverga Yuboriladigan Hodisalar Hujjatlari ===

  @Post("events/client/location-update")
  @ApiOperation({
    summary:
      "📡 C→S Event: 'location:update' / 📡 M→S Hodisasi: 'location:update'",
    description: `
**English:**
**Event:** \`location:update\`
**Direction:** Client (Driver) → Server
**Role:** \`driver\` only
**Description:** Updates the driver's real-time geographical location. The server validates the coordinates, applies rate limiting, and then broadcasts the new location to relevant subscribers.
**Usage:**
\`\`\`javascript
socket.emit('location:update', {
  driverId: "123",
  lat: 41.2995,
  lng: 69.2401,
  rideId: "ride-abc-456" // Optional
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`location:update\`
**Yo'nalish:** Mijoz (Haydovchi) → Server
**Rol:** Faqat \`driver\`
**Tavsif:** Haydovchining real vaqtdagi geografik joylashuvini yangilaydi. Server koordinatalarni tekshiradi, tezlik cheklovini qo'llaydi va so'ngra yangi joylashuvni tegishli obunachilarga uzatadi.
**Foydalanish:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiBody({ type: LocationUpdateDto })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'location:update' event. / 'location:update' hodisasi uchun hujjatlar.",
  })
  locationUpdateDocs(@Body() dto: LocationUpdateDto) {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "location:update",
      payload: dto,
    };
  }

  @Post("events/client/driver-heartbeat")
  @ApiOperation({
    summary:
      "💓 C→S Event: 'driver:heartbeat' / 💓 M→S Hodisasi: 'driver:heartbeat'",
    description: `
**English:**
**Event:** \`driver:heartbeat\`
**Direction:** Client (Driver) → Server
**Role:** \`driver\` only
**Description:** A keep-alive signal sent periodically by the driver's client. If the server doesn't receive a heartbeat within a timeout, the driver is marked as 'offline'.
**Frequency:** Recommended every 10 seconds.
**Usage:**
\`\`\`javascript
setInterval(() => {
  socket.emit('driver:heartbeat');
}, 10000);
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`driver:heartbeat\`
**Yo'nalish:** Mijoz (Haydovchi) → Server
**Rol:** Faqat \`driver\`
**Tavsif:** Haydovchi mijozi tomonidan davriy ravishda yuboriladigan "tiriklik" signali. Agar server belgilangan vaqt ichida heartbeat olmasa, haydovchi 'offline' deb belgilanadi.
**Chastota:** Har 10 soniyada tavsiya etiladi.
**Foydalanish:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'driver:heartbeat' event. / 'driver:heartbeat' hodisasi uchun hujjatlar.",
  })
  driverHeartbeatDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "driver:heartbeat",
      payload: "No payload",
    };
  }

  @Post("events/client/driver-go-offline")
  @ApiOperation({
    summary:
      "🔌 C→S Event: 'driver:go-offline' / 🔌 M→S Hodisasi: 'driver:go-offline'",
    description: `
**English:**
**Event:** \`driver:go-offline\`
**Direction:** Client (Driver) → Server
**Role:** \`driver\` only
**Description:** Allows a driver to manually signal that they are going offline. The server will clean up their session and broadcast their new 'offline' status.
**Usage:**
\`\`\`javascript
socket.emit('driver:go-offline');
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`driver:go-offline\`
**Yo'nalish:** Mijoz (Haydovchi) → Server
**Rol:** Faqat \`driver\`
**Tavsif:** Haydovchiga o'zini oflayn rejimga o'tkazish haqida qo'lda signal berish imkonini beradi. Server uning sessiyasini tozalaydi va yangi 'offline' statusini e'lon qiladi.
**Foydalanish:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'driver:go-offline' event. / 'driver:go-offline' hodisasi uchun hujjatlar.",
  })
  driverGoOfflineDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "driver:go-offline",
      payload: "No payload",
    };
  }

  @Post("events/client/driver-subscribe")
  @ApiOperation({
    summary:
      "🚗 C→S Event: 'driver:subscribe' / � M→S Hodisasi: 'driver:subscribe'",
    description: `
**English:**
**Event:** \`driver:subscribe\`
**Direction:** Client → Server
**Role:** Any authenticated user
**Description:** Subscribes the client to receive real-time location updates for a specific driver.
**Usage:**
\`\`\`javascript
socket.emit('driver:subscribe', { driverId: '123' });
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`driver:subscribe\`
**Yo'nalish:** Mijoz → Server
**Rol:** Har qanday autentifikatsiyadan o'tgan foydalanuvchi
**Tavsif:** Mijozni ma'lum bir haydovchi uchun real vaqtdagi joylashuv yangilanishlarini olish uchun obuna qiladi.
**Foydalanish:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiBody({ type: DriverSubscribeDto })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'driver:subscribe' event. / 'driver:subscribe' hodisasi uchun hujjatlar.",
  })
  driverSubscribeDocs(@Body() dto: DriverSubscribeDto) {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "driver:subscribe",
      payload: dto,
    };
  }

  @Post("events/client/ride-subscribe")
  @ApiOperation({
    summary:
      "🎫 C→S Event: 'ride:subscribe' / 🎫 M→S Hodisasi: 'ride:subscribe'",
    description: `
**English:**
**Event:** \`ride:subscribe\`
**Direction:** Client → Server
**Role:** Any authenticated user
**Description:** Subscribes the client to a specific ride to receive all relevant updates.
**Usage:**
\`\`\`javascript
socket.emit('ride:subscribe', { rideId: 'ride-abc-456' });
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`ride:subscribe\`
**Yo'nalish:** Mijoz → Server
**Rol:** Har qanday autentifikatsiyadan o'tgan foydalanuvchi
**Tavsif:** Mijozni ma'lum bir safarga obuna qilib, barcha tegishli yangilanishlarni olishini ta'minlaydi.
**Foydalanish:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiBody({ type: RideSubscribeDto })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'ride:subscribe' event. / 'ride:subscribe' hodisasi uchun hujjatlar.",
  })
  rideSubscribeDocs(@Body() dto: RideSubscribeDto) {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "ride:subscribe",
      payload: dto,
    };
  }

  @Post("events/client/drivers-in-view")
  @ApiOperation({
    summary:
      "👁️ C→S Event: 'drivers:in-view' / 👁️ M→S Hodisasi: 'drivers:in-view'",
    description: `
**English:**
**Event:** \`drivers:in-view\`
**Direction:** Client → Server
**Role:** \`client\` only
**Description:** The client sends its current map viewport. The server responds with a list of active drivers within those bounds.
**Server Response Event:** \`drivers:in-view:response\`
**Usage:**
\`\`\`javascript
const bounds = {
  ne: { lat: 41.35, lng: 69.29 },
  sw: { lat: 41.25, lng: 69.19 }
};
socket.emit('drivers:in-view', bounds);
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`drivers:in-view\`
**Yo'nalish:** Mijoz → Server
**Rol:** Faqat \`client\`
**Tavsif:** Mijoz o'zining joriy xarita ko'rinishini yuboradi. Server ushbu chegaralar ichidagi faol haydovchilar ro'yxati bilan javob beradi.
**Server Javob Hodisasi:** \`drivers:in-view:response\`
**Foydalanish:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiBody({ type: DriversInViewDto })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'drivers:in-view' event. / 'drivers:in-view' hodisasi uchun hujjatlar.",
  })
  driversInViewDocs(@Body() dto: DriversInViewDto) {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "drivers:in-view",
      payload: dto,
    };
  }

  @Post("events/client/drivers-all")
  @ApiOperation({
    summary: "🌐 C→S Event: 'drivers:all' / 🌐 M→S Hodisasi: 'drivers:all'",
    description: `
**English:**
**Event:** \`drivers:all\`
**Direction:** Client → Server
**Role:** \`admin\` or \`super_admin\` only
**Description:** An administrative event to request the locations of all currently active drivers.
**Server Response Event:** \`drivers:all:response\`
**Usage:**
\`\`\`javascript
socket.emit('drivers:all');
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`drivers:all\`
**Yo'nalish:** Mijoz → Server
**Rol:** Faqat \`admin\` yoki \`super_admin\`
**Tavsif:** Barcha joriy faol haydovchilarning joylashuvini so'rash uchun ma'muriy hodisa.
**Server Javob Hodisasi:** \`drivers:all:response\`
**Foydalanish:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'drivers:all' event. / 'drivers:all' hodisasi uchun hujjatlar.",
  })
  driversAllDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "drivers:all",
      payload: "No payload",
    };
  }

  // === Server-to-Client Event Documentation ===
  // === Serverdan Mijozga Yuboriladigan Hodisalar Hujjatlari ===

  @Post("events/server/auth-status")
  @ApiOperation({
    summary:
      "🔐 S→C Event: 'auth:success' / 'auth:error' / 🔐 S→M Hodisasi: 'auth:success' / 'auth:error'",
    description: `
**English:**
**Event:** \`auth:success\` or \`auth:error\`
**Direction:** Server → Client
**Description:** Immediate feedback after a connection attempt. \`auth:success\` on success, \`auth:error\` on failure.
**Client-side Listener:**
\`\`\`javascript
socket.on('auth:success', (data) => {
  console.log('Authenticated!', data);
});
socket.on('auth:error', (error) => {
  console.error('Auth failed:', error.message);
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`auth:success\` yoki \`auth:error\`
**Yo'nalish:** Server → Mijoz
**Tavsif:** Ulanish urinishidan so'ng darhol javob. Muvaffaqiyatli bo'lsa \`auth:success\`, muvaffaqiyatsiz bo'lsa \`auth:error\`.
**Mijoz Tomonidagi Tinglovchi:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for authentication events. / Autentifikatsiya hodisalari uchun hujjatlar.",
  })
  authStatusDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      events: ["auth:success", "auth:error"],
    };
  }

  @Post("events/server/driver-location-update")
  @ApiOperation({
    summary:
      "🛰️ S→C Event: 'driver:location:update' / 🛰️ S→M Hodisasi: 'driver:location:update'",
    description: `
**English:**
**Event:** \`driver:location:update\`
**Direction:** Server → Client
**Description:** Broadcasts a driver's new location to subscribed clients.
**Client-side Listener:**
\`\`\`javascript
socket.on('driver:location:update', (data) => {
  console.log('Driver location updated:', data);
  // { driverId: '123', lat: 41.3, lng: 69.2, timestamp: ... }
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`driver:location:update\`
**Yo'nalish:** Server → Mijoz
**Tavsif:** Haydovchining yangi joylashuvini obuna bo'lgan mijozlarga uzatadi.
**Mijoz Tomonidagi Tinglovchi:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for server-side location updates. / Server tomonidan joylashuv yangilanishlari uchun hujjatlar.",
  })
  driverLocationUpdateDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "driver:location:update",
    };
  }

  @Post("events/server/driver-status-update")
  @ApiOperation({
    summary:
      "🚦 S→C Event: 'driver:status:update' / 🚦 S→M Hodisasi: 'driver:status:update'",
    description: `
**English:**
**Event:** \`driver:status:update\`
**Direction:** Server → Client
**Description:** Notifies clients when a driver's status changes (e.g., 'online', 'offline').
**Client-side Listener:**
\`\`\`javascript
socket.on('driver:status:update', (data) => {
  console.log('Driver status changed:', data);
  // { driverId: '123', status: 'offline', reason: 'timeout' }
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`driver:status:update\`
**Yo'nalish:** Server → Mijoz
**Tavsif:** Haydovchining holati o'zgarganda (masalan, 'online', 'offline') mijozlarga xabar beradi.
**Mijoz Tomonidagi Tinglovchi:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for driver status updates. / Haydovchi holati yangilanishlari uchun hujjatlar.",
  })
  driverStatusUpdateDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "driver:status:update",
    };
  }

  @Post("events/server/drivers-in-view-response")
  @ApiOperation({
    summary:
      "👁️ S→C Event: 'drivers:in-view:response' / 👁️ S→M Hodisasi: 'drivers:in-view:response'",
    description: `
**English:**
**Event:** \`drivers:in-view:response\`
**Direction:** Server → Client
**Description:** The server's response to a \`drivers:in-view\` request, containing an array of driver locations.
**Client-side Listener:**
\`\`\`javascript
socket.on('drivers:in-view:response', (data) => {
  console.log(\`Found \${data.count} drivers in view\`, data.drivers);
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`drivers:in-view:response\`
**Yo'nalish:** Server → Mijoz
**Tavsif:** Serverning \`drivers:in-view\` so'roviga javobi, haydovchilarning joylashuvlari massivini o'z ichiga oladi.
**Mijoz Tomonidagi Tinglovchi:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'drivers:in-view:response' event. / 'drivers:in-view:response' hodisasi uchun hujjatlar.",
  })
  driversInViewResponseDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "drivers:in-view:response",
    };
  }

  @Post("events/server/drivers-all-response")
  @ApiOperation({
    summary:
      "🌐 S→C Event: 'drivers:all:response' / 🌐 S→M Hodisasi: 'drivers:all:response'",
    description: `
**English:**
**Event:** \`drivers:all:response\`
**Direction:** Server → Client
**Description:** The server's response to a \`drivers:all\` request from an admin, containing a complete list of all active drivers.
**Client-side Listener:**
\`\`\`javascript
socket.on('drivers:all:response', (data) => {
  console.log(\`Total active drivers: \${data.count}\`, data.drivers);
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`drivers:all:response\`
**Yo'nalish:** Server → Mijoz
**Tavsif:** Serverning admindan kelgan \`drivers:all\` so'roviga javobi, barcha faol haydovchilarning to'liq ro'yxatini o'z ichiga oladi.
**Mijoz Tomonidagi Tinglovchi:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "Documentation for the 'drivers:all:response' event. / 'drivers:all:response' hodisasi uchun hujjatlar.",
  })
  driversAllResponseDocs() {
    return {
      note_en: "Documentation only.",
      note_uz: "Faqat hujjatlar uchun.",
      event: "drivers:all:response",
    };
  }
}
