import * as assert from 'assert';
import { RESTIFY_PREFIX } from 'lib/constants/routes';
import { ALL, SITE_ADMIN } from 'lib/constants/scopes';
import * as orgScopes from 'lib/constants/orgScopes';
import setup from 'api/routes/tests/utils/setup';
import createOrgToken from 'api/routes/tests/utils/tokens/createOrgToken';
import createUserToken from 'api/routes/tests/utils/tokens/createUserToken';
import createRole from 'api/routes/tests/utils/models/createRole';

describe('API HTTP PATCH user route scope filtering', () => {
  const apiApp = setup();
  const ORG_ID = '0000aaaa0000aaaa0000aaaa';
  let targetUser;
  let allOrgScopeRole;
  let manageUsersScopeRole;

  const createUser = async (user) => {
    const orgToken = await createOrgToken([ALL], [], ORG_ID);
    const res = await apiApp
      .post(`${RESTIFY_PREFIX}/user`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${orgToken}`)
      .send(user);
    return res;
  };

  const updateUser = async (token, userId, body) => {
    return apiApp
      .patch(`${RESTIFY_PREFIX}/user/${userId}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  };

  before(async () => {
    allOrgScopeRole = await createRole([orgScopes.ALL], ORG_ID);
    manageUsersScopeRole = await createRole([orgScopes.MANAGE_ALL_USERS], ORG_ID);
  });

  beforeEach(async () => {
    const res = await createUser({
      name: 'target user',
      email: `target-user@ht2labs.com`,
      organisationSettings: [
        {
          scopes: [],
          roles: [],
          organisation: ORG_ID,
        },
      ]
    });
    targetUser = res.body;
  });

  it('user token having SITE_ADMIN can update any field of any user', async () => {
    const siteAdminUserToken = await createUserToken([SITE_ADMIN]);
    const newRole = await createRole([orgScopes.VIEW_ALL_JOURNEYS], ORG_ID);

    const res = await updateUser(
      siteAdminUserToken,
      targetUser._id,
      {
        name: 'updated name',
        email: 'updated-email@ht2labs.com',
        organisationSettings: [
          {
            scopes: [ALL],
            roles: [newRole._id],
            filter: 'updated filter',
            organisation: ORG_ID,
          },
        ],
      }
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'updated name');
    assert.equal(res.body.email, 'updated-email@ht2labs.com');
    assert.deepEqual(res.body.organisationSettings[0].scopes, [ALL]);
    assert.equal(res.body.organisationSettings[0].roles[0], newRole._id);
    assert.equal(res.body.organisationSettings[0].filter, 'updated filter');
  });

  it('org token having MANAGE_ALL_USERS can update its name and the organisation\'s settings', async () => {
    const manageAllUsersOrgToken = await createOrgToken([orgScopes.MANAGE_ALL_USERS], [], '0000aaaa0000aaaa0000aaaa');
    const newRole = await createRole([orgScopes.VIEW_ALL_JOURNEYS], ORG_ID);
    const res = await updateUser(
      manageAllUsersOrgToken,
      targetUser._id,
      {
        name: 'updated name',
        organisationSettings: [
          {
            scopes: [ALL],
            roles: [newRole._id],
            filter: 'updated filter',
            organisation: ORG_ID,
          },
        ],
      }
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'updated name');
    assert.deepEqual(res.body.organisationSettings[0].scopes, [ALL]);
    assert.equal(res.body.organisationSettings[0].roles[0], newRole._id);
    assert.equal(res.body.organisationSettings[0].filter, 'updated filter');
  });

  it('org token having MANAGE_ALL_USERS can NOT update other than its name and the organisation\'s settings', async () => {

  });

  it('org token having MANAGE_ALL_USERS can NOT update other organisation\'s settings', async () => {

  });

  it('org token of a user can update its name and its organisationSettings\' samlEnabled', async () => {

  });

  it('org token of a user can NOT update any other fields of itself', async () => {

  });

  it('org token of a user can NOT update any fields of other users', async () => {

  });
});
