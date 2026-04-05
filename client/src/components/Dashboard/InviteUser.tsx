import React, { useCallback, useEffect, useState } from "react"
import { inviteUser } from "../../helpers/UsersApiHelper"
import {useSelector} from "react-redux"

const errorMessages = {
    passwordsDontMatch: 'Passwords do not match. Please try again.',
    cannotConnect: 'Unable to connect. Check your network connection.',
    emailTaken: 'This email is already registered to an existing account.',
    sendEmailFailed: 'This email does not exist or the email verification server is down',
    unknownError: 'An unknown error occurred. Please refresh the page and try again.',
    formNotAllFilled: 'Please fill out every field above.',
    minPassRequirements: 'Password must have at least 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character'
  }

const InviteUser = () => {
    // Get the token from the logged in User
    const auth = useSelector((state: any) => state.auth)

    const initialState = {
        firstName: "",
        lastName: "",
        email: ""
    }

    const [formData, setFormData] = useState(initialState)
    const [message, setMessage] = useState(null)
    const [alertColor, setAlertColor] = useState('#ff5959')

    const onError = (err: any) => {
        //this.setState({ isLoading: false })
        if (err.toString() === 'Email already exists') { setMessage({ errorMessage: errorMessages.emailTaken }) }
        else if (err.toString() === 'TypeError: Failed to fetch') { setMessage({ errorMessage: errorMessages.cannotConnect }) }
        else if (err.toString() === 'Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character') { setMessage({ errorMessage: errorMessages.minPassRequirements }) }
        else if (err.toString() === 'Email does not exist') { setMessage({ errorMessage: errorMessages.sendEmailFailed }) }
        else { setMessage({ errorMessage: errorMessages.unknownError }) }
      }

    const {
        firstName,
        lastName,
        email,
    } = formData


    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault()
        setMessage(null)
    
        if(
            // Check if something wasn't filled out
            !firstName ||
            !lastName ||
            !email
            ) {
                setAlertColor('#ff5959')
                setMessage(errorMessages.formNotAllFilled)
                return
        }
        
        try{
            inviteUser(
                firstName,
                lastName,
                email,
                auth.token
            )
            setAlertColor("#29a2bd")
            setMessage("Invitation sent to researcher!!")
        } catch(error) {
            setAlertColor('#ff5959')
            setMessage("Failed to invite user")
        }

    }

    const alert = message ? (
        <div className="text-center">
          <div
            style={{
              background: alertColor,
              color: "white",
              borderRadius: "5px",
              padding: "5px",
            }}
          >
            {message}
          </div>
        </div>
      ) : null;

    return(
        <div>
            <br />
            <form className="form text-center" onSubmit={onSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Enter First Name"
                        name="firstName"
                        value={firstName}
                        onChange={onChange}
                    />
                    </div>
                    <br />
                    <div className="form-group">
                    <input
                        type="text"
                        placeholder="Enter Last Name"
                        name="lastName"
                        value={lastName}
                        onChange={onChange}
                    />
                    </div>
                    <br />
                    <div className="form-group">
                    <input
                        type="text"
                        placeholder="Enter Email"
                        name="email"
                        value={email}
                        onChange={onChange}
                    />
                    </div>
                    {alert}
                    <br />
                    <input type="submit" className="btn btn-primary" />
                    <br />
                    
            </form>
        </div>
    )
}

export default InviteUser