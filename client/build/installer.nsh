; client/build/installer.nsh - UPDATED TO REFERENCE FUNCTIONS AND INSERT PAGE
; --- 1. INCLUDE REQUIRED LIBRARIES ---
!include "MUI2.nsh" ; Modern UI 2 Header
!include "LogicLib.nsh" ; Required for ${If} / ${EndIf}
!include "nsDialogs.nsh" ; Required for custom page elements (labels, textboxes)
!include "WordFunc.nsh" ; Optional: For string functions like StrLen (already used)
!addplugindir /x86-unicode "${BUILD_RESOURCES_DIR}" ; Auto-embeds/loads InetC.dll from build/x86-unicode
; --- 2. Configuration ---
!define VALIDATION_URL "http://localhost:3001/api/validate-key"
; --- 3. Page Variables ---
Var InstallKey
Var hKeyInput ; Handle for the text input box
Var hDlg ; Handle for the dialog (required for nsDialogs)
; --- 4. Custom Page Definition ---
; This declares the page here so it's inserted early in the flow (before standard MUI pages).
; The function will now be referenced, fixing warning 6010.
Page custom LicenseKeyPage LicenseKeyPageLeave
; --- 5. Page Creation Function (Handles dialog init, controls, and display) ---
Function LicenseKeyPage
    ; Set the page title and instructions
    !insertmacro MUI_HEADER_TEXT "Activation Required" "Please enter your license key to proceed with the installation."
  
    ; Create the dialog (1018 = standard wizard page ID)
    nsDialogs::Create 1018
    Pop $hDlg
  
    ${If} $hDlg == error
        Abort "Failed to create dialog"
    ${EndIf}
  
    ; Label for the Key Input (full width for better layout)
    ${NSD_CreateLabel} 0 0 100% 12u "License Key:"
    Pop $0
  
    ; Key Input Textbox (positioned below the label)
    ${NSD_CreateText} 0 24u 100% 12u ""
    Pop $hKeyInput
  
    ; Set the initial text (optional)
    ${NSD_CreateText} $hKeyInput "POS-KEY-XXXX"
  
    ; Display the dialog
    nsDialogs::Show
FunctionEnd
; --- 6. Page Validation (Runs when user clicks 'Next') ---
Function LicenseKeyPageLeave
    ; 1. Get the key entered by the user
    ${NSD_GetText} $hKeyInput $InstallKey
  
    ; 2. Basic local validation check (key not empty)
    StrLen $R0 $InstallKey
    IntCmp $R0 0 ShowErrorKeyMissing
  
    ; 3. HTTP POST validation (Plugin auto-loaded; POST data first, /TOSTACK for response on stack)
    inetc::post "key=$InstallKey" /CAPTION "Validating..." /TOSTACK "${VALIDATION_URL}" "" /END
    Pop $R2 ; Response body (e.g., JSON from API)
    Pop $R1 ; Result ("OK" or error string)
  
    ; 4. Check result
    StrCmp $R2 "OK" 0 KeyInvalid ; If not OK, error (e.g., network fail)
  
    ; 5. Parse response for validation (updated: check for "success":true in your JSON)
    ; TEMP DEBUG: MessageBox MB_OK "API Response: $R2" ; Uncomment for testing, then rebuild
    ${WordFind} $R1 '"success":true' "E" $R3 ; Find "success":true substring (matches your API's success JSON)
    StrCmp $R3 "0" 0 KeyValid ; Found = valid
    StrCmp $R3 "-1" KeyInvalid ; Not found
  
    KeyValid:
        Goto ContinueInstall
      
    KeyInvalid:
        MessageBox MB_ICONSTOP|MB_OK "The key '$InstallKey' is invalid or expired. Please check your key and try again."
        Abort ; STOP installation and return to page
      
    ShowErrorKeyMissing:
        MessageBox MB_ICONSTOP|MB_OK "Please enter an activation key to proceed."
        Abort ; STOP installation and return to page
ContinueInstall:
    ; Proceed to the next page (e.g., Welcome or Directory)
FunctionEnd