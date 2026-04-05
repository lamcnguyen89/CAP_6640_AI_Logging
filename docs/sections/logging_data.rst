Logging Data
=================

The VERA Unity plugin provides a robust framework for logging data during XR experiments. This section will guide you through the process of logging data, 
including how to define file types, log data to those file types, and manage participant sessions.

Before beginning this section, it may be useful to review the `Unity Overview <unity_overview.html>`_ section, which provides an overview of the VERA Unity plugin and its features.

This section is divided into the following major subsections:

1. **VERA Logs**: An overview of how VERA logs data during XR experiments, including the structure of logs and how they are stored.
2. **File Types**: An overview of how custom file types are handled in the Unity plugin.
3. **The VERA Logger**: An overview of the VERA Logger, which is used to log data during XR experiments.
4. **A Logging Example**: A simple example of how to log data using the VERA Logger in Unity.
5. **Submitting and Viewing Logs**: How to submit logs to the VERA portal and view them.
6. **Participant Sessions**: An overview of how participant sessions are managed in VERA, including states and finalization.
7. **Other Useful Features**: Additional features of the VERA Unity plugin that may be useful for your experiments.
8. **Next Steps**: Guidance on where to go next in the documentation to learn more about using VERA.

VERA Logs
----------

A primary feature of the VERA Unity plugin is its ability to log data during XR experiments.

In VERA, data is recorded to a variety of file types. Most notably, data can be recorded to a CSV file, which is a common format for storing tabular data.
Each CSV file will contain structured columns that represent different aspects of each event that occurs in the XR environment.
These files can be customized to fit your research needs.

On the VERA web portal, you can define a variety of **File Types**. Each file type represents a single file which you can record data to.
Each participant session will have a single file associated with each file type defined for the experiment.
As such, you can record multiple file types for each participant session, allowing you to capture different aspects of the experiment in separate files.

For example, consider a simple experiment where you want to log the following data:

   - **Controller Interactions**: When a participant interacts with a controller, you want to log the time of the interaction, the type of interaction (e.g., button press, joystick movement), and the controller's position and rotation.
   - **Object Interactions**: When a participant interacts with an object in the XR environment. You want to log the time of the interaction, the type of interaction (e.g., picking up an object, dropping an object), and the object's position and rotation.
   - **Participant Actions**: When a participant performs a specific action, such as starting or stopping an experiment, you want to log the time of the action and any relevant details about the action.

In this case, you could define three file types in the VERA portal:

   - **Controller Interactions**: A CSV file, containing a column for the timestamp, interaction type, and controller position/rotation.
   - **Object Interactions**: A CSV file, containing a column for the timestamp, interaction type, and object position/rotation.
   - **Participant Actions**: A CSV file, containing a column for the timestamp and details about the action.

In your Unity experiment, you would then use the VERA tools to log data to these file types as the experiment progresses.
A single **Log** is therefore a single entry in any of these defined file types (for example, a single "row" in a CSV file), which can be submitted to the VERA portal for later analysis.

Any submitted logs will be stored in the VERA portal, where you can view and analyze the data collected during your experiments.
Logs will be associated with a particular participant session, allowing you to track the data collected for each participant in your experiment.

File Types
----------

The previous section provides an overview of what file types are, and how they are used in VERA at a high level.
This section will provide more detailed specifics on how the Unity plugin handles file types, and how you can use them in your experiments.

For more details on how to define file types for an experiment on the web portal, see the `Web Portal: Overview <web_overview.html>`_ section.

- In the VERA Unity plugin, upon selecting an active experiment, C# code is generated for each of the experiment's CSV file types.

   - A single C# class is generated for each CSV file type.
   - Each of these classes is named according to its corresponding file type. The class is prefixed by **"VERAFile_"**, followed by the name of the particular file type as defined on the VERA portal.
   - For example, if you have a CSV file type named "ControllerInteractions", the generated class will be named **"VERAFile_ControllerInteractions"**.

- These C# classes can be used to log data to the corresponding CSV file during the experiment.

   - Each class has a static function named **CreateCsvEntry()** which will create a single new entry (one new row) for that CSV file.
   - The function accepts parameters according to how the file type was defined on the web portal.
   - For example, if the "ControllerInteractions" file type has columns for timestamp, interaction type, and controller position/rotation, the **CreateCsvEntry()** function will accept parameters for each of these columns.
   - Once you log an entry, the data is automatically formatted and stored into a local CSV file.
   - This local CSV file is then submitted to the VERA portal periodically. More details on submission are provided in the next sections.

- Each of these generated C# classes additionally comes with a single preprocessor directive.

   - Preprocessor directives are used to conditionally compile code based on certain conditions.
   - The directive for a file is named according to its corresponding file type. The directive is prefixed by **"VERAFile_"**, followed by the name of the particular file type as defined on the VERA portal.
   - For example, if you have a CSV file type named "ControllerInteractions", the generated directive will be named **"VERAFile_ControllerInteractions"**.
   - You can use this directive to ensure you are only compiling code related to a specific file type when you are using that file type in your experiment.

The VERA Logger
-----------------

The VERA Logger is the primary tool used to log data during XR experiments in Unity.
It provides a simple interface for logging data to the various file types defined in the VERA portal.

**VERALogger.cs** is the script used by VERA to perform logs. This script is a MonoBehaviour that can be attached to any GameObject in your Unity scene.

The VERA Logger is a singleton, meaning there is only one instance of it in your Unity project.

Since the VERA Logger is a singleton, you can access it from anywhere in your code using the following line:

.. code-block:: csharp

   VERALogger.Instance

The VERA Logger is the only necessary VERA component you need to add to your scene in order to log data.
If you want to record data, ensure that the VERA Logger is present in your scene. 
The file type scripts outlined above use this VERA Logger to log data to the corresponding CSV files, and will not function without the VERA Logger.

A Logging Example
------------------

Let's consider a simple example of how to log data using the VERA Logger in Unity.

Assume you want to log data for a "ControllerTransforms" CSV file type defined in the VERA portal.
You want this file to log the transform of the player's controllers (position and rotation) every frame during the experiment.
Each row in the CSV file will represent a single frame of data.

Assume that you've already set up the "ControllerTransforms" file type in the VERA portal, and it has the following columns:

- **ts**: The time at which the data was logged. This should be included by default.
- **eventId**: A custom identifier for the event. This can be any number you choose.
- **Transform**: The transform of the controller in the XR environment.

For more details on how to define file types on the web portal, see the `Web Portal: Overview <web_overview.html>`_ section.

Once you select your experiment in Unity, the VERA Unity plugin will generate a C# class named **VERAFile_ControllerTransforms**.
This is the file we will use to log data to the "ControllerTransforms" CSV file.

Our goal is to log the controller's transform every frame during the experiment. As such, let's make a new C# script. We'll call it **ControllerLogging.cs**.

In this script, we will use the **VERAFile_ControllerTransforms** class to log the controller's transform every frame, using Unity's `Update()` method.

   .. code-block:: csharp

      using UnityEngine;

      public class ControllerTransforms : MonoBehaviour
      {
         public int controllerId;

         void Update()
         {
            #if VERAFile_ControllerTransforms
               VERAFile_ControllerTransforms.CreateCsvEntry(controllerId, transform);
            #endif
         }
      }

Let's start from the top of this example script:

- We define a new class named **ControllerTransforms** that inherits from `MonoBehaviour`, allowing it to be attached to a GameObject in Unity.
- We define a public integer variable named **controllerId**. This will be used to identify which controller's transform we are logging. This variable is public, so it can be set in the Unity Inspector. Let's say an ID of 0 represents the left controller, and an ID of 1 represents the right controller.
- We implement the `Update()` method, which is called once per frame in Unity.
- In this Update method, we use a preprocessor directive to check if the **VERAFile_ControllerTransforms** class is defined.

   - If it is defined, we call the **CreateCsvEntry()** method of the **VERAFile_ControllerTransforms** class.
   - We pass in the **controllerId** and the `transform` of the GameObject this script is attached to.
   - The `transform` contains the position and rotation of the GameObject in the XR environment.
   - This is in the order of the columns defined in the "ControllerTransforms" file type on the VERA portal - the first column, **ts** (timestamp), is handled automatically; we then pass the controllerId for **eventId**, the second column; and lastly we pass the transform for the **Transform** column.
   - The **CreateCsvEntry()** method will handle formatting the data and writing it to the local CSV file.
   
- Note that the preprocessor directive ensures that this code is only compiled if the **VERAFile_ControllerTransforms** class is defined.
- This allows you to conditionally compile code based on whether you are using this specific file type.

Now that we have our custom script, we can attach it to the GameObject representing the controller in our Unity scene.
We also need to make sure to add a **VERALogger.cs** script component somewhere in the scene, which will allow us to record data.

Now, we can run our project, and the **ControllerTransforms** script will log the controller's transform every frame to the "ControllerTransforms" CSV file.
We can then view the data in the VERA portal after the experiment is complete.

Submitting and Viewing Logs
-------------------------------------

The VERA Unity plugin automatically handles the submission of logs to the VERA portal.
When you run your Unity project, the VERA Logger will periodically submit the logged data to the portal.
By default, the interval between submissions is 3 seconds. 
You can monitor the automatic submissions in the Unity console, where you will see messages indicating that data is being submitted.

If a data upload fails, the VERA Logger will automatically retry the submission until it succeeds.
This ensures that your data is always submitted to the VERA portal, even if there are temporary network issues.
Once the data is submitted, you can view it in the VERA portal by selecting the experiment in the dashboard, 
and selecting the particular participant session you wish to inspect.

If you wish to record data locally, need to recover recorded data, or otherwise simply wish to obtain the data directly from your local machine,
you can navigate to the `VERA` folder in your Unity project directory. 
Inside this folder, you will find the outputted recorded CSV files, stored locally. These files should exactly match that which exists on the VERA portal.
This local data recording will always occur, and can be used as a last resort to recover data. 
In a built experiment, these local files are stored in Unity's persistent data path, which is platform-dependent.

Whereas VERA logs are automatically submitted, you can also manually submit logs at any time.
To do this, you can call the **VERALogger.Instance.SubmitAllCSVs()** method from anywhere in your Unity code.
Alternatively, you can call a particular file type's **SubmitCsvFile()** method to submit only that file type.
These functions can be used to force a submission of the logs at any time, such as when you want to ensure that all data is submitted before the Unity session ends,
or when automatic periodic submissions are not sufficient for your needs.

Participant Sessions
---------------------

When the Unity session begins, a participant is automatically created for the experiment and synced with the VERA web portal.
This participant session is marked with the date and time of the session start on the web portal, and is automatically assigned a unique identifier.

Participant sessions begin in the **In Experiment** state. This state signifies that the participant has started the experiment,
but has not yet completed it, and no issues have occurred in the process.

If something goes wrong during the experiment process, such as a crash or an unexpected termination of the Unity session,
the participant session will be marked as **Incomplete**. This state indicates data might not be fully finalized.
Prematurely quitting a Unity session while data is being actively recorded will also result in an **Incomplete** state.

A participant session which is **Complete** signifies that the participant has finished the experiment successfully, and all data has been finalized and submitted.
VERA participants MUST be marked as **Complete** manually - this process does not occur automatically.

To mark a participant session as **Complete**, use the VERALogger's **FinalizeSession()** method:

   .. code-block:: csharp

      VERALogger.Instance.FinalizeSession();

Upon calling this method, all CSV files will be manually synced. No new data can be recorded after finalizing a session.
The participant will be marked as **Complete**, and the data will be available for viewing in the VERA portal.

Other Useful Features
----------------------

Below are a few additional features of the VERA Unity plugin that may be useful for your experiments:

- **VERALogger.Instance.sessionFinalized**: A boolean indicating whether the current participant session is finalized (i.e. marked as **Complete**).
- **VERALogger.Instance.initialized**: A boolean indicating whether the VERALogger has been successfully initialized and is ready to log data.
- **VERALogger.Instance.collecting**: A boolean indicating whether the VERA Logger is currently collecting data.

Next Steps
-----------

For more information on the VERA Unity plugin as a whole, refer to the `Unity Plugin: Overview <unity_overview.html>`_ section.

For details on the VERA web portal and how to manage your experiments, refer to the `Web Portal: Overview <web_overview.html>`_ section.

For details on building and uploading your Unity experiment for WebXR, refer to the `WebXR Guide <webxr.html>`_.