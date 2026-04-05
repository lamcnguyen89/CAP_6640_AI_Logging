import React from 'react'
import { Pagination } from 'react-bootstrap'

interface paginationProps {
    currentPage: any;
    firstPage: any;
    lastPage: any;
    classname: string;
    size?: any;
    onClick?: any;
}

const Paginations: any = ({ firstPage, lastPage, currentPage, classname, size, onClick }: paginationProps) => {
  const items = []
  for (let number = firstPage; number <= lastPage; number++) {
    items.push(
      <Pagination.Item key={number} active={currentPage} onClick={onClick}>
        {number}
      </Pagination.Item>
    )
  }

  return (
    <Pagination size={size} className={classname} >{items}</Pagination>
  )
}

export default Paginations
