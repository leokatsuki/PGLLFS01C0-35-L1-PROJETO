const generateResource = (model:object, properties:object|null=null, actions:object|null=null) => {
    return {
        resource: model,
        options: {
            properties: {
                createdAt: {
                    isVisible: { add: false, edit: false, list: true, filter: true }
                },
                updatedAt: {
                    isVisible: { add: false, edit: false, list: true, filter: true }
                },
                ...properties
            },
            actions: actions
        }
    }
}

export { generateResource }