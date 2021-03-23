# Under construction

## Explanation
Depending on the version of your MongoDB server, you must configure the server differently. There are two connection URI types, `mongodb+srv://` (supplies SRV seedlist) and `mongodb://` (connects to a single server or supplies a legacy seedlist). See [the MongoDB docs](https://docs.mongodb.com/manual/reference/connection-string/) for more info.

## SRV seedlist configuration
Your connection string should look something like this
```
mongodb+srv://mongodb.example.com/databasename
```

## Single server/legacy seedlist congiuration
```
mongodb://mongodb.example.com/databasename
```