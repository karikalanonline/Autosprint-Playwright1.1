Feature: Salesforce Sandbox Login

    Scenario: Successful login to Salesforce Sandbox
        Given I am on the Salesforce login page "https://test.salesforce.com"
        When I enter my User Name as "UserName" in the username field
        And I enter my Password as "Password" in the password field
        And I click the "Log In to Sandbox" button
        Then I should be successfully logged into the Salesforce Sandbox environment
        And I should see the Salesforce dashboard or homepage
