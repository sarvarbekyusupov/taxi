# Payme Integration

This module provides endpoints for integrating with the Payme payment gateway for card tokenization and charging.

## Endpoints

### Save Card

`POST /payme/save-card`

This endpoint allows users to save their card details with Payme. Upon successful saving, a card token (card ID) is returned, which can be stored in your database for future transactions.

#### Request Body

```json
{
  "cardNumber": "string",
  "expireDate": "string"
  // Add any other necessary fields as per Payme API documentation
}
```

#### Response

```json
{
  "cardToken": "string"
}
```

### Charge Card

`POST /payme/charge-card`

This endpoint allows you to charge a user's saved card using the card token obtained from the `save-card` endpoint.

#### Request Body

```json
{
  "cardToken": "string",
  "amount": number
  // Add any other necessary fields as per Payme API documentation
}
```

#### Response

```json
{
  "success": boolean,
  "message": "string"
}
```
