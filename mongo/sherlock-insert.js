let error = false
let res = [
  db.sherlock_dev.drop(),

  db.createUser(
    {
      user: "sherlock_dev",
      pwd: "password",
      roles: [
        {
          role: "readWrite",
          db: "sherlock_dev"
        }
      ]
    }
  )
]

printjson(res)

if (error) {
  print('Error, exiting')
  quit(1)
}
