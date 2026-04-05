import React from 'react'
import { useSelector } from 'react-redux'
import { Spinner, Container } from 'reactstrap'
import NavMenu from './NavMenu'


/** What to show while pages are loading */
const Loading = () => {
  const auth = useSelector((state: any) => state.auth)

    return (
      <>
        {auth ? undefined /*<NavMenu title="Dashboard" />*/ : undefined}
        <Container
          className="container-fluid d-flex justify-content-center align-items-center"
          style={{
            height: '100vh',  // Full page height
          }}
        >
          <Container
            className="bg-light border text-center"
            style={{
              margin: 'auto',
            }}
          >
            <Spinner
              color="primary"
              style={{
                height: '3rem',
                width: '3rem'
              }}
              type="grow"
            />
            <div>Loading...</div>
          </Container>
        </Container>
      </>
    )
}
export default Loading
