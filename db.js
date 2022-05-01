const { use } = require('express/lib/router');
const { QuickDB } = require('quick.db');
const db = new QuickDB({ filePath: "db.sqlite" });


async function addServer (id) {
  if (db.get(`servers.${id}`)) return;
  await db.set(`servers.${id}`, {
    proxies: {},
    users: {},
    limit: 3
  });
}

async function removeServer (id) {
  if (!db.get(`servers.${id}`)) return;
  await db.set(`servers.${id}`, {});
}

async function getUser (id, userId) {
  if (!db.get(`servers.${id}`)) return;
  let user = await db.get(`servers.${id}.users.${userId}`) || {
    count: 0,
    links: []
  };
  return user;
}

async function setUser (id, userId, user) {
  if (!db.get(`servers.${id}`)) return;
  await db.set(`servers.${id}.users.${userId}`, user);
}

async function getLimit (id) {
  if (!db.get(`servers.${id}`)) return 3;
  return await db.get(`servers.${id}.limit`);
}

async function setLimit (id, limit) {
  if (!db.get(`servers.${id}`)) return;
  await db.set(`servers.${id}.limit`, limit);
}

async function reset (id, userId) {
  if (!db.get(`servers.${id}`)) return error("Server not found, please contact support.");
  if (userId) {
    let user = await db.get(`servers.${id}.users.${userId}`) || {
      count: 0,
      links: []
    };
    user.count = 0;
    await db.set(`servers.${id}.users.${userId}`, user);
  } else {
    let users = await db.get(`servers.${id}.users`) || [];
    users.forEach((user) => {
      user.count = 0;
    });
    await db.set(`servers.${id}.users`, users);
  }
}

async function addLink (id, type, link) {
  if (type.startsWith("__")) return error("Invalid link type.");
  if (!/https?:\/\/.+\..+/i.test(link)) return error("Invalid link.");
  if (!db.get(`servers.${id}`)) return error("Server not found, please contact support.");
  let links = await db.get(`servers.${id}.proxies.${type}`) || [];
  if (links.includes(link)) return error("Link already exists.");
  await db.push(`servers.${id}.proxies.${type}`, link);
  return success();
}

async function removeLink (id, type, link) {
  if (!db.get(`servers.${id}`)) return error("Server not found, please contact support.");
  let links = await db.get(`servers.${id}.proxies.${type}`) || [];
  if (!links.includes(link)) return error("Link does not exist.");  
  links = links.filter(l => l !== link);
  await db.set(`servers.${id}.proxies.${type}`, links);
  return success();
}

async function getTypes (id) {
  if (!db.get(`servers.${id}`)) return error("Server not found, please contact support.");
  let proxies = await db.get(`servers.${id}.proxies`);
  proxies = Object.entries(proxies).filter(([type, links]) => links.length > 0);
  proxies = Object.fromEntries(proxies);
  return success(Object.keys(proxies));
}

async function getLinks (id, type) {
  if (!db.get(`servers.${id}`)) return error("Server not found, please contact support.");
  let proxies = await db.get(`servers.${id}.proxies.${type}`) || [];
  if (proxies.length <= 0) return error("No links found.");
  return success(proxies);
}

function error (message) {
  return {
    status: false,
    message: message
  }
}

function success (data) {
  return {
    status: true,
    data: data
  }
}

module.exports = { addServer, removeServer, reset, addLink, removeLink, setTimeout, getTypes, getLinks, getUser, setUser, getLimit, setLimit };
