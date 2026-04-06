Feature: POST /api/auth/register
  As a new user
  I want to create an account with email and password
  So that I can start using Arvi

  Scenario: Successful registration returns 201 with a JWT
    When a POST request is sent to "/api/auth/register" with JSON body:
      """
      { "email": "new@example.com", "password": "secure-password-123" }
      """
    Then the response status should be 201
    And the response header "content-type" should contain "application/json"
    And the response body should contain a non-empty "token" field
    And the response body "user" object should have a non-empty "id" field
    And the response body "user" object field "email" should equal "new@example.com"

  Scenario: Registration with missing email returns 400
    When a POST request is sent to "/api/auth/register" with JSON body:
      """
      { "password": "secure-password-123" }
      """
    Then the response status should be 400
    And the response body field "error" should equal "VALIDATION_ERROR"

  Scenario: Registration with missing password returns 400
    When a POST request is sent to "/api/auth/register" with JSON body:
      """
      { "email": "new@example.com" }
      """
    Then the response status should be 400
    And the response body field "error" should equal "VALIDATION_ERROR"
