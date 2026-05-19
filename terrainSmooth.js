export function smoothTerrainMesh(
    ground,
    subdivisions,
    iterations = 3,
    strength = 0.6
) {

    const positions = ground.getVerticesData(
        BABYLON.VertexBuffer.PositionKind
    );

    const indices = ground.getIndices();

    if (!positions || !indices) {
        return;
    }

    const gridSize = subdivisions + 1;

    for (let iteration = 0; iteration < iterations; iteration++) {

        const newPositions = positions.slice();

        for (let z = 1; z < gridSize - 1; z++) {

            for (let x = 1; x < gridSize - 1; x++) {

                const index = z * gridSize + x;
                const positionIndex = index * 3;

                const centerY = positions[positionIndex + 1];

                const leftY = positions[((z * gridSize + (x - 1)) * 3) + 1];
                const rightY = positions[((z * gridSize + (x + 1)) * 3) + 1];
                const upY = positions[(((z - 1) * gridSize + x) * 3) + 1];
                const downY = positions[(((z + 1) * gridSize + x) * 3) + 1];

                const averageY = (
                    centerY +
                    leftY +
                    rightY +
                    upY +
                    downY
                ) / 5;

                newPositions[positionIndex + 1] =
                    centerY + (averageY - centerY) * strength;
            }
        }

        for (let i = 0; i < positions.length; i++) {
            positions[i] = newPositions[i];
        }
    }

    const normals = [];

    BABYLON.VertexData.ComputeNormals(
        positions,
        indices,
        normals
    );

    ground.updateVerticesData(
        BABYLON.VertexBuffer.PositionKind,
        positions
    );

    ground.updateVerticesData(
        BABYLON.VertexBuffer.NormalKind,
        normals
    );

    ground.refreshBoundingInfo();
}