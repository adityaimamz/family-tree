async function main() {
  console.log("No tracked family seed data is bundled with this template.");
  console.log("Use the admin panel or your own private seed script to populate the database.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
