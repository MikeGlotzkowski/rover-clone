# User Stories

## Actors
1. **Pet Owner** - Has pets, needs services
2. **Service Provider (Sitter/Walker)** - Offers boarding or walking services
3. **System** - Platform that connects them

---

## Epic 1: User Registration & Profiles

### US-1.1: Owner Registration
**As a** pet owner  
**I want to** create an account  
**So that** I can book pet services

**Acceptance Criteria:**
- Can sign up with email/password
- Can add basic profile info (name, location, phone)
- Can add pet profiles (name, breed, size, age, special needs)

### US-1.2: Provider Registration
**As a** service provider  
**I want to** create a provider account  
**So that** I can offer my services

**Acceptance Criteria:**
- Can sign up with email/password
- Can add profile info + bio
- Can specify services offered (boarding, walking, or both)
- Can set availability and pricing
- Can add photos of their space (for boarding)

### US-1.3: Provider Profile View
**As a** pet owner  
**I want to** view provider profiles  
**So that** I can choose the right person for my pet

**Acceptance Criteria:**
- Can see provider's bio, photos, services, pricing
- Can see reviews/ratings
- Can see availability

---

## Epic 2: Boarding Service

### US-2.1: Search for Boarding
**As a** pet owner  
**I want to** search for boarding providers  
**So that** I can find someone to care for my pet while I'm away

**Acceptance Criteria:**
- Can search by location
- Can filter by dates, pet size, price range
- Results show provider cards with key info

### US-2.2: Book Boarding
**As a** pet owner  
**I want to** request a boarding booking  
**So that** my pet has a place to stay

**Acceptance Criteria:**
- Can select dates (check-in, check-out)
- Can select which pet(s)
- Can add notes for the provider
- Booking goes to provider for approval

### US-2.3: Manage Boarding Requests
**As a** service provider  
**I want to** accept or decline boarding requests  
**So that** I can manage my schedule

**Acceptance Criteria:**
- Can view incoming requests
- Can accept or decline with optional message
- Calendar updates on acceptance

---

## Epic 3: Walking Service

### US-3.1: Search for Walkers
**As a** pet owner  
**I want to** search for dog walkers  
**So that** my dog gets exercise when I'm busy

**Acceptance Criteria:**
- Can search by location
- Can filter by availability, price
- Results show walker cards

### US-3.2: Book a Walk
**As a** pet owner  
**I want to** book a dog walk  
**So that** my dog gets walked

**Acceptance Criteria:**
- Can select date and time
- Can select walk duration (30min, 60min)
- Can select which dog(s)
- Can add pickup instructions

### US-3.3: Manage Walk Requests
**As a** service provider  
**I want to** accept or decline walk requests  
**So that** I can manage my schedule

**Acceptance Criteria:**
- Can view incoming requests
- Can accept or decline
- Can see daily walk schedule

---

## Epic 4: Booking Management

### US-4.1: View My Bookings (Owner)
**As a** pet owner  
**I want to** see all my bookings  
**So that** I can track my pet's care

**Acceptance Criteria:**
- Can see upcoming bookings
- Can see past bookings
- Can see booking status (pending, confirmed, completed, cancelled)

### US-4.2: View My Schedule (Provider)
**As a** service provider  
**I want to** see my schedule  
**So that** I know what's coming up

**Acceptance Criteria:**
- Calendar or list view of bookings
- Can see client and pet details

### US-4.3: Cancel Booking
**As a** pet owner or provider  
**I want to** cancel a booking  
**So that** I can handle changes in plans

**Acceptance Criteria:**
- Can cancel with reason
- Other party is notified

---

## Epic 5: Reviews & Ratings

### US-5.1: Leave a Review
**As a** pet owner  
**I want to** leave a review after service  
**So that** others can benefit from my experience

**Acceptance Criteria:**
- Can rate 1-5 stars
- Can write text review
- Review appears on provider profile

### US-5.2: View Reviews
**As a** pet owner  
**I want to** read reviews of providers  
**So that** I can make informed decisions

**Acceptance Criteria:**
- Reviews visible on provider profile
- Average rating displayed

---

## Epic 6: Messaging

### US-6.1: Message Provider
**As a** pet owner  
**I want to** message a provider  
**So that** I can ask questions before booking

**Acceptance Criteria:**
- Can send messages through platform
- Provider can respond
- Message history preserved

---

## Priority for MVP

### P0 (Must Have)
- US-1.1, US-1.2, US-1.3 (Registration & Profiles)
- US-2.1, US-2.2, US-2.3 (Boarding)
- US-3.1, US-3.2, US-3.3 (Walking)
- US-4.1, US-4.2 (View Bookings)

### P1 (Should Have)
- US-4.3 (Cancel Booking)
- US-5.1, US-5.2 (Reviews)

### P2 (Nice to Have)
- US-6.1 (Messaging)
