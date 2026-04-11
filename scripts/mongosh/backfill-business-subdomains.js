function usernameToSubdomain(username) {
  return String(username || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-/g, "");
}

const businesses = db.businesses.find({
  username: { $exists: true, $ne: "" },
});

let updated = 0;
let skipped = 0;
let conflicts = 0;

while (businesses.hasNext()) {
  const business = businesses.next();
  const nextSubdomain = usernameToSubdomain(business.username);

  if (!nextSubdomain) {
    skipped += 1;
    continue;
  }

  const conflict = db.businesses.findOne({
    _id: { $ne: business._id },
    subdomain: nextSubdomain,
  });

  if (conflict) {
    conflicts += 1;
    print(
      `Conflict: "${business.username}" cannot use subdomain "${nextSubdomain}" because business ${conflict._id} already has it.`
    );
    continue;
  }

  db.businesses.updateOne(
    { _id: business._id },
    {
      $set: {
        subdomain: nextSubdomain,
      },
    }
  );

  updated += 1;
}

printjson({
  updated,
  skipped,
  conflicts,
});
