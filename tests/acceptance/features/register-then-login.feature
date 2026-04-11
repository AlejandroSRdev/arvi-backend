Feature: Register then login
  As a new user
  I want to register and immediately log in with the same credentials
  So that I can verify the full onboarding flow works end-to-end

  Scenario: A freshly registered user can log in
    When a POST request is sent to "/api/auth/register" with JSON body:
      """
      { "email": "fresh@example.com", "password": "my-secure-password" }
      """
    Then the response status should be 201
    When a POST request is sent to "/api/auth/login" with JSON body:
      """
      { "email": "fresh@example.com", "password": "my-secure-password" }
      """
    Then the response status should be 200
    And the response body should contain a non-empty "token" field
