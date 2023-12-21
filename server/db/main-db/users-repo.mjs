import { BasicDbRepo } from '../basic-db-repo.mjs';

export class UsersRepo extends BasicDbRepo {
  
  constructor(db, tableName, logger) {
    super(db, tableName, logger);
  }

  insertOne(data) {
    return this.db.dbRw()(this.tableName).insert(data);
  }

  updateByEmailAddress(email_address, data) {
    // exclude some fields
    const { id, created_at, email_address: ignore, ...rest } = data || {};
    rest.updated_at = new Date();
    return this.db.dbRw()(this.tableName).where({ email_address }).update(rest);
  }

  deleteByEmailAddress(email_address) {
    return this.db.dbRw()(this.tableName).where({ email_address }).del();
  }

}
