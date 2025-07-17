import { Controller, Post, Body, Get } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiParam,
} from "@nestjs/swagger";
import { CreateRideChatDto } from "./dto/create-ride-chat.dto";

// DTOs for documentation
class RideSubscribeDto {
  rideId: string;
}

class ChatMessageResponseDto {
  rideId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  messageId: string;
}

class ChatHistoryResponseDto {
  rideId: string;
  messages: ChatMessageResponseDto[];
  totalCount: number;
}

class SocketErrorResponseDto {
  error: string;
  code: string;
  message: string;
}

@Controller("ride-chat-gateway-docs")
@ApiTags("🚗 Ride Chat Gateway WebSocket Documentation")
@ApiBearerAuth()
@ApiHeader({
  name: "x-role",
  description:
    "User role required for WebSocket connection (driver/client) / WebSocket ulanish uchun kerakli foydalanuvchi roli",
  required: true,
  enum: ["driver", "client"],
})
export class RideChatGatewayDocsController {
  @Get("connection-info")
  @ApiOperation({
    summary:
      "🔌 WebSocket Connection Information / WebSocket Ulanish Ma'lumotlari",
    description: `
**English:**
**WebSocket Endpoint:** \`/ride-chat\`
**Namespace:** \`/ride-chat\`
**Authentication:** Bearer token in connection auth or handshake
**Required Headers:** 
- \`x-role\`: 'driver' or 'client'
- \`Authorization\`: 'Bearer <token>'

**Connection Example:**
\`\`\`javascript
const socket = io('/ride-chat', {
  auth: {
    token: 'your-jwt-token'
  },
  extraHeaders: {
    'x-role': 'driver' // or 'client'
  }
});
\`\`\`

---

**O'zbekcha:**
**WebSocket Endpoint:** \`/ride-chat\`
**Namespace:** \`/ride-chat\`
**Autentifikatsiya:** Bearer token ulanishda auth yoki handshake orqali
**Kerakli Headerlar:**
- \`x-role\`: 'driver' yoki 'client'
- \`Authorization\`: 'Bearer <token>'

**Ulanish Misoli:**
\`\`\`javascript
// Yuqoridagi kod namunasiga qarang
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "WebSocket connection guidelines / WebSocket ulanish ko'rsatmalari",
  })
  getConnectionInfo() {
    return {
      endpoint: "/ride-chat",
      namespace: "/ride-chat",
      authentication: "Bearer token required",
      requiredHeaders: ["x-role", "Authorization"],
      supportedRoles: ["driver", "client"],
    };
  }

  @Post("events/client/chat-subscribe")
  @ApiOperation({
    summary: "🎫 C→S Event: 'chat:subscribe' / M→S Hodisasi: 'chat:subscribe'",
    description: `
**English:**
**Event:** \`chat:subscribe\`
**Direction:** Client → Server
**Role:** Any authenticated user (driver/client) in the ride
**Description:** Subscribes the client to a specific ride's chat room to receive real-time messages and chat history.

**Usage:**
\`\`\`javascript
socket.emit('chat:subscribe', { rideId: 'ride-abc-456' });

// Handle success response
socket.on('chat:subscribe:success', (data) => {
  console.log('Successfully subscribed to ride chat:', data.rideId);
});

// Handle error response
socket.on('chat:subscribe:error', (error) => {
  console.error('Subscription failed:', error.message);
});
\`\`\`

**Server Response Events:**
- \`chat:subscribe:success\` - Subscription successful
- \`chat:subscribe:error\` - Subscription failed
- \`chat:history\` - Chat history sent after successful subscription

---

**O'zbekcha:**
**Hodisa:** \`chat:subscribe\`
**Yo'nalish:** Mijoz → Server
**Rol:** Safardagi har qanday autentifikatsiyadan o'tgan foydalanuvchi
**Tavsif:** Mijozni ma'lum safar chat xonasiga obuna qilib, real vaqtda xabarlar va chat tarixini olish imkonini beradi.
    `,
  })
  @ApiBody({
    type: RideSubscribeDto,
    examples: {
      subscribe: {
        summary: "Subscribe to ride chat",
        description: "Subscribe to receive messages for a specific ride",
        value: { rideId: "ride-abc-456" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Subscription successful / Obuna muvaffaqiyatli",
    schema: {
      example: {
        success: true,
        rideId: "ride-abc-456",
        subscribedAt: "2024-07-17T10:30:00Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid ride ID or unauthorized access / Noto'g'ri ride ID yoki ruxsatsiz kirish",
    type: SocketErrorResponseDto,
  })
  chatSubscribeDocs(@Body() dto: RideSubscribeDto) {
    return {
      event: "chat:subscribe",
      payload: dto,
      responseEvents: [
        "chat:subscribe:success",
        "chat:subscribe:error",
        "chat:history",
      ],
    };
  }

  @Post("events/client/chat-send-message")
  @ApiOperation({
    summary:
      "💬 C→S Event: 'chat:send_message' / M→S Hodisasi: 'chat:send_message'",
    description: `
**English:**
**Event:** \`chat:send_message\`
**Direction:** Client → Server
**Role:** Any authenticated user subscribed to the ride chat
**Description:** Sends a message to the ride's chat. Server validates, stores, and broadcasts to all participants.

**Message Constraints:**
- Maximum length: 1000 characters
- Minimum length: 1 character
- No HTML tags allowed
- Emoji support enabled

**Usage:**
\`\`\`javascript
socket.emit('chat:send_message', {
  rideId: "ride-abc-456",
  senderId: "user-123",
  message: "Hello, I'm on my way! 🚗"
});

// Handle success response
socket.on('chat:message:sent', (data) => {
  console.log('Message sent successfully:', data.messageId);
});

// Handle error response
socket.on('chat:message:error', (error) => {
  console.error('Message sending failed:', error.message);
});
\`\`\`

**Server Response Events:**
- \`chat:message:sent\` - Message sent successfully
- \`chat:message:error\` - Message sending failed
- \`chat:new_message\` - Broadcasted to all other participants

---

**O'zbekcha:**
**Hodisa:** \`chat:send_message\`
**Yo'nalish:** Mijoz → Server
**Rol:** Safar chatiga obuna bo'lgan har qanday autentifikatsiyadan o'tgan foydalanuvchi
**Tavsif:** Safar chatiga xabar yuboradi. Server tekshiradi, saqlaydi va barcha ishtirokchilarga uzatadi.

**Xabar Cheklovlari:**
- Maksimal uzunlik: 1000 belgi
- Minimal uzunlik: 1 belgi
- HTML teglar ruxsat berilmagan
- Emoji qo'llab-quvvatlanadi
    `,
  })
  @ApiBody({
    type: CreateRideChatDto,
    examples: {
      textMessage: {
        summary: "Send text message",
        description: "Send a regular text message to the ride chat",
        value: {
          rideId: "ride-abc-456",
          senderId: "user-123",
          message: "Hello, I'm on my way!",
        },
      },
      emojiMessage: {
        summary: "Send message with emoji",
        description: "Send a message containing emojis",
        value: {
          rideId: "ride-abc-456",
          senderId: "user-123",
          message: "Almost there! 🚗💨",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Message sent successfully / Xabar muvaffaqiyatli yuborildi",
    schema: {
      example: {
        success: true,
        messageId: "msg-789",
        timestamp: "2024-07-17T10:35:00Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid message format or length / Noto'g'ri xabar formati yoki uzunligi",
    type: SocketErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Not subscribed to ride chat / Ride chatiga obuna emas",
    type: SocketErrorResponseDto,
  })
  chatSendMessageDocs(@Body() dto: CreateRideChatDto) {
    return {
      event: "chat:send_message",
      payload: dto,
      constraints: {
        maxLength: 1000,
        minLength: 1,
        allowedFormats: ["text", "emoji"],
        forbiddenContent: ["HTML", "scripts"],
      },
      responseEvents: [
        "chat:message:sent",
        "chat:message:error",
        "chat:new_message",
      ],
    };
  }

  @Post("events/server/chat-new-message")
  @ApiOperation({
    summary:
      "📨 S→C Event: 'chat:new_message' / S→M Hodisasi: 'chat:new_message'",
    description: `
**English:**
**Event:** \`chat:new_message\`
**Direction:** Server → Client
**Trigger:** When another user sends a message to the ride chat
**Description:** Broadcasts a new message to all clients subscribed to the ride's chat (except the sender).

**Client-side Listener:**
\`\`\`javascript
socket.on('chat:new_message', (data) => {
  console.log('New message received:', data);
  
  // Update UI with new message
  addMessageToChat({
    messageId: data.messageId,
    senderId: data.senderId,
    senderName: data.senderName,
    message: data.message,
    timestamp: data.timestamp,
    isOwn: false
  });
});
\`\`\`

**Message Object Structure:**
- \`messageId\`: Unique message identifier
- \`rideId\`: Ride identifier
- \`senderId\`: User ID of message sender
- \`senderName\`: Display name of sender
- \`message\`: Message content
- \`timestamp\`: ISO 8601 timestamp
- \`senderRole\`: 'driver' or 'client'

---

**O'zbekcha:**
**Hodisa:** \`chat:new_message\`
**Yo'nalish:** Server → Mijoz
**Sabab:** Boshqa foydalanuvchi ride chatiga xabar yuborganda
**Tavsif:** Safar chatiga obuna bo'lgan barcha mijozlarga yangi xabarni uzatadi (yuboruvchidan tashqari).
    `,
  })
  @ApiResponse({
    status: 200,
    description: "New message broadcast format / Yangi xabar uzatish formati",
    type: ChatMessageResponseDto,
    examples: {
      driverMessage: {
        summary: "Message from driver",
        // description: "Example message sent by a driver",
        value: {
          messageId: "msg-789",
          rideId: "ride-abc-456",
          senderId: "user-456",
          senderName: "John Driver",
          senderRole: "driver",
          message: "I'm approaching the pickup location",
          timestamp: "2024-07-17T10:35:00Z",
        },
      },
      clientMessage: {
        summary: "Message from client",
        // description: "Example message sent by a client",
        value: {
          messageId: "msg-790",
          rideId: "ride-abc-456",
          senderId: "user-123",
          senderName: "Jane Client",
          senderRole: "client",
          message: "Thank you! I'll be waiting outside",
          timestamp: "2024-07-17T10:36:00Z",
        },
      },
    },
  })
  chatNewMessageDocs() {
    return {
      event: "chat:new_message",
      direction: "Server → Client",
      trigger: "When another user sends a message",
      excludes: "Message sender (no echo)",
      dataStructure: {
        messageId: "string",
        rideId: "string",
        senderId: "string",
        senderName: "string",
        senderRole: "driver | client",
        message: "string",
        timestamp: "ISO 8601 string",
      },
    };
  }

  @Post("events/server/chat-history")
  @ApiOperation({
    summary: "📜 S→C Event: 'chat:history' / S→M Hodisasi: 'chat:history'",
    description: `
**English:**
**Event:** \`chat:history\`
**Direction:** Server → Client
**Trigger:** Automatically sent after successful \`chat:subscribe\`
**Description:** Sends the complete chat history for the ride to the newly subscribed client.

**Client-side Listener:**
\`\`\`javascript
socket.on('chat:history', (data) => {
  console.log('Chat history received:', data);
  
  // Load chat history into UI
  data.messages.forEach(message => {
    addMessageToChat({
      messageId: message.messageId,
      senderId: message.senderId,
      senderName: message.senderName,
      message: message.message,
      timestamp: message.timestamp,
      isOwn: message.senderId === currentUserId
    });
  });
  
  console.log(\`Loaded \${data.totalCount} messages\`);
});
\`\`\`

**History Object Structure:**
- \`rideId\`: Ride identifier
- \`messages\`: Array of message objects (ordered by timestamp)
- \`totalCount\`: Total number of messages in history
- \`loadedAt\`: Timestamp when history was loaded

**Message Ordering:** Messages are ordered chronologically (oldest first)
**Pagination:** Currently loads all messages (pagination may be added in future)

---

**O'zbekcha:**
**Hodisa:** \`chat:history\`
**Yo'nalish:** Server → Mijoz
**Sabab:** Muvaffaqiyatli \`chat:subscribe\` dan keyin avtomatik yuboriladi
**Tavsif:** Yangi obuna bo'lgan mijozga ride uchun to'liq chat tarixini yuboradi.
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Chat history response format / Chat tarixi javob formati",
    type: ChatHistoryResponseDto,
    examples: {
      emptyHistory: {
        summary: "Empty chat history",
        // description: "Response when no messages exist for the ride",
        value: {
          rideId: "ride-abc-456",
          messages: [],
          totalCount: 0,
          loadedAt: "2024-07-17T10:30:00Z",
        },
      },
      withMessages: {
        summary: "Chat history with messages",
        // description: "Response containing existing chat messages",
        value: {
          rideId: "ride-abc-456",
          messages: [
            {
              messageId: "msg-001",
              rideId: "ride-abc-456",
              senderId: "user-123",
              senderName: "Jane Client",
              senderRole: "client",
              message: "Hello, I'm ready for pickup",
              timestamp: "2024-07-17T10:25:00Z",
            },
            {
              messageId: "msg-002",
              rideId: "ride-abc-456",
              senderId: "user-456",
              senderName: "John Driver",
              senderRole: "driver",
              message: "On my way! ETA 5 minutes",
              timestamp: "2024-07-17T10:26:00Z",
            },
          ],
          totalCount: 2,
          loadedAt: "2024-07-17T10:30:00Z",
        },
      },
    },
  })
  chatHistoryDocs() {
    return {
      event: "chat:history",
      direction: "Server → Client",
      trigger: "After successful chat:subscribe",
      ordering: "Chronological (oldest first)",
      includes: "All messages for the ride",
      dataStructure: {
        rideId: "string",
        messages: "ChatMessageResponseDto[]",
        totalCount: "number",
        loadedAt: "ISO 8601 string",
      },
    };
  }

  @Post("events/server/chat-user-joined")
  @ApiOperation({
    summary:
      "👋 S→C Event: 'chat:user_joined' / S→M Hodisasi: 'chat:user_joined'",
    description: `
**English:**
**Event:** \`chat:user_joined\`
**Direction:** Server → Client
**Trigger:** When a new user subscribes to the ride chat
**Description:** Notifies all existing participants that a new user has joined the chat.

**Client-side Listener:**
\`\`\`javascript
socket.on('chat:user_joined', (data) => {
  console.log('User joined chat:', data);
  
  // Show system message in chat
  addSystemMessage(\`\${data.userName} joined the chat\`);
  
  // Update participant list
  updateParticipantsList(data.participants);
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`chat:user_joined\`
**Yo'nalish:** Server → Mijoz
**Sabab:** Yangi foydalanuvchi ride chatiga obuna bo'lganda
**Tavsif:** Barcha mavjud ishtirokchilarga yangi foydalanuvchi chatga qo'shilgani haqida xabar beradi.
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "User joined notification format / Foydalanuvchi qo'shildi bildirish formati",
    schema: {
      example: {
        userId: "user-789",
        userName: "Mike Client",
        userRole: "client",
        rideId: "ride-abc-456",
        joinedAt: "2024-07-17T10:40:00Z",
        participants: [
          { userId: "user-123", userName: "Jane Client", role: "client" },
          { userId: "user-456", userName: "John Driver", role: "driver" },
          { userId: "user-789", userName: "Mike Client", role: "client" },
        ],
      },
    },
  })
  chatUserJoinedDocs() {
    return {
      event: "chat:user_joined",
      direction: "Server → Client",
      trigger: "New user subscription",
      purpose: "Notify existing participants of new joiner",
    };
  }

  @Post("events/server/chat-user-left")
  @ApiOperation({
    summary: "👋 S→C Event: 'chat:user_left' / S→M Hodisasi: 'chat:user_left'",
    description: `
**English:**
**Event:** \`chat:user_left\`
**Direction:** Server → Client
**Trigger:** When a user disconnects or unsubscribes from the ride chat
**Description:** Notifies remaining participants that a user has left the chat.

**Client-side Listener:**
\`\`\`javascript
socket.on('chat:user_left', (data) => {
  console.log('User left chat:', data);
  
  // Show system message in chat
  addSystemMessage(\`\${data.userName} left the chat\`);
  
  // Update participant list
  updateParticipantsList(data.participants);
});
\`\`\`

---

**O'zbekcha:**
**Hodisa:** \`chat:user_left\`
**Yo'nalish:** Server → Mijoz
**Sabab:** Foydalanuvchi uzilganda yoki ride chatdan chiqganda
**Tavsif:** Qolgan ishtirokchilarga foydalanuvchi chatdan chiqgani haqida xabar beradi.
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "User left notification format / Foydalanuvchi chiqdi bildirish formati",
    schema: {
      example: {
        userId: "user-789",
        userName: "Mike Client",
        userRole: "client",
        rideId: "ride-abc-456",
        leftAt: "2024-07-17T10:45:00Z",
        participants: [
          { userId: "user-123", userName: "Jane Client", role: "client" },
          { userId: "user-456", userName: "John Driver", role: "driver" },
        ],
      },
    },
  })
  chatUserLeftDocs() {
    return {
      event: "chat:user_left",
      direction: "Server → Client",
      trigger: "User disconnection or unsubscription",
      purpose: "Notify remaining participants of user departure",
    };
  }

  @Get("error-codes")
  @ApiOperation({
    summary: "⚠️ Error Codes Reference / Xato Kodlari Ma'lumotnomasi",
    description: `
**English:**
Common error codes that may be returned by the ride chat WebSocket events.

**O'zbekcha:**
Ride chat WebSocket hodisalari tomonidan qaytarilishi mumkin bo'lgan umumiy xato kodlari.
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      "List of possible error codes / Mumkin bo'lgan xato kodlari ro'yxati",
    schema: {
      example: {
        CHAT_001: "Ride not found",
        CHAT_002: "User not authorized for this ride",
        CHAT_003: "User not subscribed to ride chat",
        CHAT_004: "Message too long (max 1000 characters)",
        CHAT_005: "Message too short (min 1 character)",
        CHAT_006: "Invalid message format",
        CHAT_007: "Rate limit exceeded",
        CHAT_008: "Chat disabled for this ride",
        CHAT_009: "User blocked from chat",
        CHAT_010: "Connection authentication failed",
      },
    },
  })
  getErrorCodes() {
    return {
      CHAT_001: {
        code: "CHAT_001",
        message: "Ride not found",
        description: "The specified ride ID does not exist",
        solution: "Verify the ride ID and ensure the ride exists",
      },
      CHAT_002: {
        code: "CHAT_002",
        message: "User not authorized for this ride",
        description: "User is not a participant in the specified ride",
        solution: "Ensure user is either the driver or a passenger of the ride",
      },
      CHAT_003: {
        code: "CHAT_003",
        message: "User not subscribed to ride chat",
        description: "User must subscribe to chat before sending messages",
        solution: "Call chat:subscribe event before sending messages",
      },
      CHAT_004: {
        code: "CHAT_004",
        message: "Message too long",
        description: "Message exceeds maximum length of 1000 characters",
        solution: "Shorten the message to 1000 characters or less",
      },
      CHAT_005: {
        code: "CHAT_005",
        message: "Message too short",
        description: "Message must contain at least 1 character",
        solution: "Ensure message is not empty",
      },
      CHAT_006: {
        code: "CHAT_006",
        message: "Invalid message format",
        description: "Message contains forbidden content or invalid format",
        solution: "Remove HTML tags, scripts, or other forbidden content",
      },
      CHAT_007: {
        code: "CHAT_007",
        message: "Rate limit exceeded",
        description: "Too many messages sent in a short time period",
        solution: "Wait before sending the next message",
      },
      CHAT_008: {
        code: "CHAT_008",
        message: "Chat disabled for this ride",
        description: "Chat functionality is disabled for this ride",
        solution: "Contact support if chat should be enabled",
      },
      CHAT_009: {
        code: "CHAT_009",
        message: "User blocked from chat",
        description: "User has been blocked from participating in chat",
        solution: "Contact support to resolve blocking issue",
      },
      CHAT_010: {
        code: "CHAT_010",
        message: "Connection authentication failed",
        description: "Invalid or expired authentication token",
        solution: "Refresh authentication token and reconnect",
      },
    };
  }

  @Get("flow-diagram")
  @ApiOperation({
    summary: "🔄 Chat Flow Diagram / Chat Oqimi Diagrammasi",
    description: `
**English:**
Typical flow of events in the ride chat system.

**O'zbekcha:**
Ride chat tizimidagi hodisalarning odatdagi oqimi.
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Chat flow sequence / Chat oqimi ketma-ketligi",
  })
  getChatFlow() {
    return {
      sequence: [
        {
          step: 1,
          event: "WebSocket Connection",
          description:
            "Client connects to /ride-chat namespace with auth token and x-role header",
          participants: ["Client", "Server"],
        },
        {
          step: 2,
          event: "chat:subscribe",
          description: "Client subscribes to specific ride chat room",
          participants: ["Client → Server"],
        },
        {
          step: 3,
          event: "chat:subscribe:success",
          description: "Server confirms subscription success",
          participants: ["Server → Client"],
        },
        {
          step: 4,
          event: "chat:history",
          description: "Server sends existing chat history",
          participants: ["Server → Client"],
        },
        {
          step: 5,
          event: "chat:user_joined",
          description: "Server notifies other participants of new joiner",
          participants: ["Server → Other Clients"],
        },
        {
          step: 6,
          event: "chat:send_message",
          description: "Client sends a message to the chat",
          participants: ["Client → Server"],
        },
        {
          step: 7,
          event: "chat:message:sent",
          description: "Server confirms message was sent successfully",
          participants: ["Server → Sender"],
        },
        {
          step: 8,
          event: "chat:new_message",
          description: "Server broadcasts message to all other participants",
          participants: ["Server → Other Clients"],
        },
        {
          step: 9,
          event: "chat:user_left",
          description: "Server notifies when a user disconnects",
          participants: ["Server → Remaining Clients"],
        },
      ],
      notes: {
        authentication: "All events require valid authentication",
        errorHandling:
          "Each client event has corresponding success/error responses",
        realTime:
          "Messages are broadcast in real-time to all subscribed participants",
        persistence: "Chat history is stored and retrieved on subscription",
      },
    };
  }
}
