import React, { useCallback, useEffect, useState } from "react"
import { useTable, useSortBy, useFilters } from 'react-table'
import { getAllUsers } from "../../helpers/UsersApiHelper"
import {useSelector} from "react-redux"
// import useWebSocket, { ReadyState } from 'react-use-websocket'
import {deleteUser} from "../../helpers/UsersApiHelper"
import {
    Table,
    Button
  } from 'reactstrap'
import { usePromiseTracker } from "react-promise-tracker"
import { ThreeDots } from "react-loader-spinner"

const LoadingIndicator = () => (
  <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
    <ThreeDots color="#2BAD60" height="100" width="100" />
  </div>
)


const UsersTable = () => {

    // Get the token from the logged in User
    const auth = useSelector((state: any) => state.auth)

    let [researchers, setResearchers] = useState()
    const [message, setMessage] = useState("")
    const [alertColor, setAlertColor] = useState("#ff5959")
    const [index, setIndex] = useState(undefined)
    const { promiseInProgress } = usePromiseTracker({ area: "table" })
    const [seed, setSeed] = useState(1)
   
    // Get all users
    useEffect(() => {
      if(seed){
        getAllUsers(auth.token)
        .then(res => (
          setResearchers(res.users)
        )) 
      }

    },[seed])

    
  
    const tryDeleteUser = (e:any, activeUserId:string, userId:string, authToken: string): void => {
      e.preventDefault()
      setMessage("")

      if(activeUserId === userId) {
        setMessage("Cannot delete active user")
        return
      }
      try {
        deleteUser(activeUserId,userId, authToken)
        console.log("Successfully Deleted")
        setResearchers(researchers.filter((researcher:any) => researcher._id !== userId))
        // setSeed(Math.random())

      } catch(error) {
        console.log(error)
      }

    }

    const alert = message ? (
      <div className="home-inputs">
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
  


    // Set up React Table
function ParticipantTable({ columns, data }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
    initialState: { sortBy: [{ id: 'sessionStart', desc: true }] }
  }, useFilters, useSortBy)

  return (
    <>
    <div className="text-center">
      {alert}
      </div>
      {rows.length > 0 ?
    <Table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => {

          const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps()
          return <tr key={key} {...restHeaderGroupProps}>
            {headerGroup.headers.map((column, i) => {
              const { key, ...restColumn } = column.getHeaderProps()
              return (
                <th key={i} {...restColumn}>
                  {column.render('Header')}
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
                </th>
              )
            })}
          </tr>
        })}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row)
          const { key, ...restRowProps } = row.getRowProps()
          return (
            <tr key={key} {...restRowProps}>
              {row.cells.map(cell => {
                const { key, ...restCellProps } = cell.getCellProps()
                return (
                  <td key={key} {...restCellProps}>{cell.render('Cell')}</td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
        </Table>
        : <div className="text-center">No Researchers Found</div>}
    </>
  )
};

// Set up Columns to be used in React Table
const columns = React.useMemo(
  () => [
    {
      Header: 'First Name',
      accessor: 'firstName',
      Cell: ({ value, row }) =>
        value,
      width: 50,
      disableFilters: true
    },
    {
      Header: 'Last Name',
      accessor: 'lastName',
      Cell: ({ value, row }) =>
        value,
      width: 50,
      disableFilters: true
    },
    {
      Header: 'Email',
      accessor: 'email',
      Cell: ({ value, row }) =>
        value,
      width: 50,
      disableFilters: true
    },
    {
      Header: 'Delete Researcher',
      //auth.user.id, row.original._id
      width: 50,
      Cell: ({value,row}) => <Button variant="outline-secondary" onClick={(e)=>{tryDeleteUser(e,auth.user.id,row.original._id,auth.token)}}>Delete</Button>
    }

  ],
  [researchers, index]
)




    return (
      <>
        {promiseInProgress || !Array.isArray(columns) || !Array.isArray(researchers) ?
          <LoadingIndicator></LoadingIndicator>
          :
          <ParticipantTable columns={columns} data={researchers} />}
      
      </>

    )

}

export default UsersTable


