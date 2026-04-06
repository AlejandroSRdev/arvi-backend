Feature: GET /api/user/dashboard
  As an authenticated user
  I want to view my dashboard
  So that I can see my profile, plan, and usage limits

  Scenario: Authenticated user gets their dashboard
    Given a registered user exists with email "alex@example.com" and password "pw"
    And the user logs in with email "alex@example.com" and password "pw"
    When a GET request is sent to "/api/user/dashboard" with the Authorization header
    Then the response status should be 200
    And the response header "content-type" should contain "application/json"
    And the response body should contain a "profile" object
    And the response body should contain a "limits" object

  Scenario: Unauthenticated request returns 401
    When a GET request is sent to "/api/user/dashboard" without an Authorization header
    Then the response status should be 401
    And the response body field "error" should equal "AUTHENTICATION_ERROR"
