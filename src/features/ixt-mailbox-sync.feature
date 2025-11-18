Feature: Ixt Mailbox Sync
    Background:
        Given I am logged into Salesforce
        And Navigate to the IXT WebForm Page

    @ixt_webform_case_tc01
    Scenario: Create a case via webform
        When I select "Myself and/or dependent(s)" from the "I’m submitting on behalf of" dropdown
        And I select "H-1B Cap Sponsorship" from the "I have a question about" dropdown
        And I select "Status of case" from the "Tell us more" dropdown
        And I enter "Playwright Automation" in the "Describe your inquiry" textbox
        And I click the "Submit" button
        And I click the "Yes" button
        Then The form should be successfully submitted
        And I do the proxy login to verify the case details
        And I click the mailbox sync tab
        And I open the respective IXT mailbox record
        And I verify the "Owner" field contains "IXTQueue"
        And I verify the "Case Status" field contains "New"
        And I verify the "Category" field contains "H-1B Cap Sponsorship"
        And I verify the "Subcategory 1" field contains "Status of case"
        And I verify the "Source" field contains "Form"
        And I verify the "Email Status" field that should contain "Sent" under the Emails section

    @ixt_webform_case_tc2
    Scenario: Create an immigration case via webform
        When I select "Myself and/or dependent(s)" from the "I’m submitting on behalf of" dropdown
        And I select "H-1B Cap Sponsorship" from the "I have a question about" dropdown
        And I select "Status of case" from the "Tell us more" dropdown
        And I enter "Playwright Automation" in the "Describe your inquiry" textbox
        And I click the "Submit" button
        And I click the "Yes" button
        Then The form should be successfully submitted
        And I do the proxy login to verify the case details
        And I click the mailbox sync tab
        And I open the respective IXT mailbox record
        And I verify the "Owner" field contains "IXTQueue"
        And I verify the "Case Status" field contains "New"
        And I verify the "Category" field contains "H-1B Cap Sponsorship"
        And I verify the "Subcategory 1" field contains "Status of case"
        And I verify the "Source" field contains "Form"
        And I verify the "Email Status" field that should contain "Sent" under the Emails section

