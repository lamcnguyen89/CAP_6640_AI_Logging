import React, { useCallback, useEffect, useState } from "react"
import styled from 'styled-components'
import { useTable, useSortBy, useFilters } from 'react-table'
import { key } from "localforage"
// Define a custom filter filter function!

export function ParticipantTable({ columns, data, setIndex }) {
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
    defaultCanFilter: false
  },
    useFilters,
    useSortBy
  )
  console.log(rows)
  // Render the UI for your table
  return (
    rows.length === 0 ? <div>No participants. Start by collecting data from Unity.</div> :
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => {
          const { key, ...restHeaderGroupProps }
            = headerGroup.getHeaderGroupProps()
          return (
            <tr key={key} {...restHeaderGroupProps}>
              {headerGroup.headers.map((column, i) => {
                const { key, ...restColumn } = column.getHeaderProps(column.getSortByToggleProps())
                return (
                  <th key={key} scope="col" {...restColumn} >
                    <div>{column.render('Header')}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? ' 🔽'
                            : ' 🔼'
                          : ''}
                      </span>
                    </div>
                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                  </th>
                )
              })}
            </tr>
          )
        })}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)
          const { key, ...restRowProps } = row.getRowProps()
          return (
            <tr key={key} {...restRowProps}
            >
              {row.cells.map((cell) => {
                const { key, ...restCellProps } = cell.getCellProps()
                return <td key={key} {...restCellProps}>{cell.render('Cell')}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
export default ParticipantTable