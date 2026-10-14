function showDockCacheNotice(message) {
    let notice = document.getElementById('dockDatabaseNotice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'dockDatabaseNotice';
        notice.setAttribute('role', 'status');
        notice.style.cssText =
            'position:fixed;top:0;left:0;right:0;z-index:9999;padding:10px 16px;background:#fff3cd;color:#664d03;text-align:center;font:14px sans-serif';
        document.body.prepend(notice);
    }
    notice.textContent = message;
}

window.mergeDockShipCache = function (storageKey, databaseShips) {
    let cachedShips;
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        cachedShips = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`Could not merge docking cache "${storageKey}"`, error);
        showDockCacheNotice(`Could not read saved browser data: ${error.message}`);
        return databaseShips;
    }

    const identity = ship => [
        String(ship.ship_name || ship.shipName || '').trim().toLowerCase(),
        String(ship.stay_start || ship.stayStart || '').replace('T', ' ').slice(0, 10),
        String(ship.stay_end || ship.stayEnd || '').replace('T', ' ').slice(0, 10)
    ].join('|');
    const unmatchedCache = new Set(cachedShips.map((_, index) => index));
    const mergedShips = databaseShips.map(databaseShip => {
        const index = cachedShips.findIndex((cachedShip, cachedIndex) =>
            unmatchedCache.has(cachedIndex) &&
            ((Number(cachedShip.id) > 0 && Number(cachedShip.id) === Number(databaseShip.id)) ||
                identity(cachedShip) === identity(databaseShip))
        );
        if (index < 0) return databaseShip;
        unmatchedCache.delete(index);
        return { ...cachedShips[index], ...databaseShip };
    });

    for (const index of unmatchedCache) {
        if (!(Number(cachedShips[index].id) > 0)) mergedShips.push(cachedShips[index]);
    }
    return mergedShips;
};

window.syncDockShipsWithDatabase = async function (dockId, storageKey, apiRequest) {
    let cachedShips;
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        cachedShips = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`Could not read docking cache "${storageKey}"`, error);
        showDockCacheNotice(`Could not read saved browser data: ${error.message}`);
        return { success: false, data: [], message: error.message };
    }

    const response = await apiRequest(
        '/ships.php',
        { method: 'GET' },
        { success: false, data: [], message: 'Database request failed' }
    );
    if (!response || !response.success || !Array.isArray(response.data)) {
        showDockCacheNotice(
            `Database connection failed. Showing browser-saved data only. ${response?.message || ''}`.trim()
        );
        return {
            success: false,
            data: [],
            message: response?.message || 'Could not load ships from database'
        };
    }

    const databaseShips = response.data.filter(ship => Number(ship.dock_id) === dockId);
    const key = ship => [
        String(ship.ship_name || ship.shipName || '').trim().toLowerCase(),
        String(ship.stay_start || ship.stayStart || '').replace('T', ' ').slice(0, 10),
        String(ship.stay_end || ship.stayEnd || '').replace('T', ' ').slice(0, 10)
    ].join('|');
    const shipsByKey = new Map(databaseShips.map(ship => [key(ship), ship]));
    let syncMessage = '';

    for (const ship of cachedShips) {
        if (Number(ship.id) > 0) continue;
        const existing = shipsByKey.get(key(ship));
        if (existing) {
            ship.id = Number(existing.id);
            continue;
        }

        const loa = Number(ship.loaMin ?? ship.loa);
        const beam = Number(ship.beamMin ?? ship.beam);
        const gt = Number(ship.gtMin ?? ship.gt);
        const dwt = Number(ship.dwtMin ?? ship.dwt);
        const draft = Number(ship.draft);
        const dateTime = value => {
            const text = String(value || '').replace('T', ' ');
            return text.length >= 19 ? text.slice(0, 19) : `${text.slice(0, 10)} 00:00:00`;
        };
        const payload = {
            dock_id: dockId,
            ship_name: ship.shipName || ship.ship_name,
            loa,
            loa_min: loa,
            loa_max: Number(ship.loaMax ?? ship.loa ?? loa),
            loa_text: ship.loaText || String(loa),
            beam,
            beam_min: beam,
            beam_max: Number(ship.beamMax ?? ship.beam ?? beam),
            beam_text: ship.beamText || String(beam),
            draft,
            draft_max: Number(ship.draftMax ?? ship.draft),
            draft_text: ship.draftText || String(draft),
            gt,
            gt_min: gt,
            gt_max: Number(ship.gtMax ?? ship.gt ?? gt),
            gt_text: ship.gtText || String(gt),
            dwt,
            dwt_min: dwt,
            dwt_max: Number(ship.dwtMax ?? ship.dwt ?? dwt),
            dwt_text: ship.dwtText || String(dwt),
            stay_start: dateTime(ship.stayStart || ship.stay_start),
            stay_end: dateTime(ship.stayEnd || ship.stay_end),
            schedule_date: String(ship.date || ship.schedule_date || ship.stayStart || '').slice(0, 10)
        };

        const saved = await apiRequest(
            '/ships.php',
            { method: 'POST', body: JSON.stringify(payload) },
            { success: false, message: 'Database request failed' }
        );
        if (saved?.success && saved.ship_id) {
            ship.id = Number(saved.ship_id);
            shipsByKey.set(key(ship), { ...payload, id: ship.id, dock_id: dockId });
        } else {
            syncMessage = `Some browser-only ships could not sync: ${saved?.message || 'Database request failed'}`;
        }
    }

    try {
        localStorage.setItem(storageKey, JSON.stringify(cachedShips));
    } catch (error) {
        console.error(`Could not update docking cache "${storageKey}"`, error);
        syncMessage = `Database is connected, but local browser cache could not be updated: ${error.message}`;
    }

    const refreshed = await apiRequest(
        '/ships.php',
        { method: 'GET' },
        { success: false, data: [], message: 'Database request failed' }
    );
    if (!refreshed?.success || !Array.isArray(refreshed.data)) {
        showDockCacheNotice(
            `Could not refresh ships from database. Browser-saved data was kept. ${refreshed?.message || ''}`.trim()
        );
        return { success: false, data: [], message: refreshed?.message || 'Could not refresh database data' };
    }

    if (syncMessage) showDockCacheNotice(syncMessage);
    return {
        success: true,
        data: refreshed.data.filter(ship => Number(ship.dock_id) === dockId),
        message: syncMessage
    };
};
