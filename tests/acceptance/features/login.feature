Feature: POST /api/auth/login
  As a registered user
  I want to exchange my credentials for a JWT
  So that I can authenticate subsequent requests

  Scenario: Successful login returns 200 with a JWT
    Given a registered user exists with email "alex@example.com" and password "correct-horse-battery"
    When a POST request is sent to "/api/auth/login" with JSON body:
      """
      { "email": "alex@example.com", "password": "correct-horse-battery" }
      """
    Then the response status should be 200
    And the response header "content-type" should contain "application/json"
    And the response body should contain a non-empty "token" field
    And the response body field "userId" should equal the registered user's id

  Scenario: Wrong password returns 401
    Given a registered user exists with email "alex@example.com" and password "correct-horse-battery"
    When a POST request is sent to "/api/auth/login" with JSON body:
      """
      { "email": "alex@example.com", "password": "wrong-password" }
      """
    Then the response status should be 401
    And the response body field "error" should equal "AUTHENTICATION_ERROR"
    And the response body should not contain a "token" field

  Scenario: Unknown email returns 401
    When a POST request is sent to "/api/auth/login" with JSON body:
      """
      { "email": "ghost@example.com", "password": "anything" }
      """
    Then the response status should be 401
    And the response body field "error" should equal "AUTHENTICATION_ERROR"

  Scenario: Missing email returns 400
    When a POST request is sent to "/api/auth/login" with JSON body:
      """
      { "password": "anything" }
      """
    Then the response status should be 400
    And the response body field "error" should equal "VALIDATION_ERROR"

  Scenario: Missing password returns 400
    When a POST request is sent to "/api/auth/login" with JSON body:
      """
      { "email": "alex@example.com" }
      """
    Then the response status should be 400
    And the response body field "error" should equal "VALIDATION_ERROR"
