import fs from 'fs';
import fetch from 'node-fetch';

(async () => {
  const data = await (await fetch('https://spdx.org/licenses/licenses.json')).json();
  fs.writeFileSync(
    'licenses.json',
    JSON.stringify(
      Object.fromEntries(
        data.licenses
          .filter((l) => !l.isDeprecatedLicenseId)
          .sort((a, b) => a.licenseId.localeCompare(b.licenseId))
          .map((l) => [
            l.licenseId,
            {
              name: l.name,
              osi: l.isOsiApproved || undefined,
              free: l.isFsfLibre || undefined,
              CC: l.licenseId.startsWith('CC') || undefined,
            },
          ]),
      ),
      null,
      2,
    ),
  );
})();
