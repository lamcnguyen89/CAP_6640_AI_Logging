import React, { useEffect, useState } from "react"
import styled from 'styled-components'
import { useTable } from 'react-table'
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"

import { persistedState } from "../main"
import { Button } from "react-bootstrap"
// Show all participants
const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }

  
`
function Table({ columns, data }) {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
  })

  // Render the UI for your table
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// Use throughout your app instead of plain `useDispatch` and `useSelector`
type AppDispatch = typeof persistedState.store.dispatch
type RootState = ReturnType<typeof persistedState.store.getState>

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector


export default function ({ match, participant, setShowLogs }) {
  let [images, setImages] = useState([])
  const columns = React.useMemo(
    () => {
      console.log("Images update")
      let cols =
        [
          {
            Header: 'TS',
            accessor: 'ts',
            Cell: ({ value }) => <span>{new Date(value).toLocaleString()
            }</span>
          },
          {
            Header: 'Image',
            accessor: 'imageData',
            Cell: ({ value }) => <img src={`data:image/png;base64,${value}`} alt="Image" style={{ width: '100px', height: 'auto' }} />
          }
        ]
      return cols
    },
    [images]
  )

  const auth = useAppSelector((state: any) => state.auth)
  useEffect(() => {
    let pId = ""
    console.log(match.params.participantId)
    console.log(participant)
    if (match.params.participantId !== undefined) {
      pId = match.params.participantId
    } else {
      pId = participant
    }
    let sId = ""
    console.log(match.params.projectId)
    if (match.params.projectId !== undefined) {
      sId = match.params.projectId
    } else {
      // pId = participant
    }
    console.log("Fetching " + `/api/images/` + sId + `/` + pId)
    fetch(`/api/images/${sId}/${pId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth.token
      },
    })
      .then(async (res) => {
        let js = await res.json()
        console.log("Received images")
        js.forEach(item => {
          console.log(item.data.data)
          item.imageData = btoa(String.fromCharCode(...new Uint8Array(item.data.data)))
        })
        setImages(js)
      })

  }, [])
  return (<>
    <Button onClick={() => setShowLogs("")}>Back to Overview</Button>
    <Styles>
      <Table columns={columns} data={images} />
    </Styles>
    {/* <DateTime value={pairDateTime} onChange={(time)=>setPairDateTime(time)}></DateTime> */}
  </>)
}