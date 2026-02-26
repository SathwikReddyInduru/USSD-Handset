import { useState } from 'react'
import axios from "axios"
import styles from './MobileSimulator.module.css'

const MobileSimulator = () => {
    const [view, setView] = useState("dialer")
    const [screenText, setScreenText] = useState("")
    const [userInputText, setUserInputText] = useState("")
    const [userInputOption, setUserInputOption] = useState("")
    const [msisdn, setMsisdn] = useState("1234567890")
    const [isSessionActive, setIsSessionActive] = useState(false)
    const [pageId, setPageId] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const handleDial = () => {
        if (msisdn.length < 10) {
            alert("Please enter a valid mobile number first.")
            return
        }
        setView("ussd")
        setScreenText(`Handset Active: ${msisdn}\n\nDial *123# to start`)
        setPageId(0)
    }

    const handleSend = async () => {
        setIsLoading(true)

        try {
            let payload

            // 🔥 Before session starts (shortcode entry)
            if (!isSessionActive) {
                payload = {
                    MSISDN: msisdn,
                    PageId: 0,
                    UserInputOption: "",
                    UserInputText: ""
                }
            }
            // 🔥 After session starts (navigation)
            else {
                payload = {
                    MSISDN: msisdn,
                    PageId: pageId,
                    UserInputOption: userInputOption.trim() || "",
                    UserInputText: userInputText.trim() || ""
                }
            }

            console.log("Sending:", payload)

            const response = await axios.post(
                "http://10.10.19.188:6215/api/simulate-ussd",
                payload
            )

            const ussdResponse = response.data.ussd_response

            setScreenText(ussdResponse.UserOutputText)
            setPageId(ussdResponse.PageId)
            setIsSessionActive(true)

            if (ussdResponse.TerminateFlag === "Y") {
                setTimeout(() => {
                    handleEndCall()
                }, 3000)
            }

            // Clear inputs after sending
            setUserInputOption("")
            setUserInputText("")

        } catch (error) {
            console.error(error)
            setScreenText("Network Error")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEndCall = () => {
        setIsSessionActive(false)
        setUserInputOption("")
        setUserInputText("")
        setView("dialer")
        setScreenText("")
        setPageId(0)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend()
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.phoneFrame}>
                <div className={styles.earpiece}></div>

                <div className={styles.screen}>
                    {view === "dialer" ? (
                        <div className={styles.dialerContainer}>
                            <div className={styles.statusBar}>
                                <span>Network</span>
                            </div>
                            <h2 className={styles.heading}>Enter Mobile No.</h2>
                            <input
                                className={styles.dialInput}
                                value={msisdn}
                                onChange={(e) => setMsisdn(e.target.value)}
                                placeholder="1234567890"
                            />
                            <div className={styles.keypad}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map(key => (
                                    <button
                                        key={key}
                                        className={styles.key}
                                        onClick={() => setMsisdn(prev => prev + key)}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleDial} className={styles.callBtn}>
                                Initialize Handset
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.statusBar}>
                                <span>{msisdn}</span>
                                <span>{new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}</span>
                            </div>

                            <div className={styles.ussdContent}>
                                {isLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                        <div style={{ marginBottom: '10px' }}>⏳</div>
                                        Loading...
                                    </div>
                                ) : (
                                    screenText.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))
                                )}
                            </div>

                            <div className={styles.inputArea}>
                                {/* ✅ Show text input ONLY after session starts */}
                                {isSessionActive && (
                                    <input
                                        className={styles.input}
                                        value={userInputText}
                                        onChange={(e) => setUserInputText(e.target.value)}
                                        placeholder="Enter text (optional)"
                                        onKeyDown={handleKeyPress}
                                        disabled={isLoading}
                                    />
                                )}

                                {/* ✅ Option input always visible */}
                                <input
                                    className={styles.input}
                                    value={userInputOption}
                                    onChange={(e) => setUserInputOption(e.target.value)}
                                    placeholder={
                                        !isSessionActive
                                            ? "Dial Shortcode (*123#)"
                                            : "Enter option..."
                                    }
                                    onKeyDown={handleKeyPress}
                                    autoFocus
                                    disabled={isLoading}
                                />

                                <div className={styles.buttonRow}>
                                    <button
                                        onClick={handleEndCall}
                                        className={styles.cancelBtn}
                                        disabled={isLoading}
                                    >
                                        End
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        className={styles.sendBtn}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.homeBtn} onClick={() => setView("dialer")}></div>
            </div>
        </div>
    )
}

export default MobileSimulator