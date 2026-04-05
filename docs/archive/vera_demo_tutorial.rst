VERA Demo Tutorial
===================

**NOTE**: *This section is currently obsolete and will be removed in a future release. Please refer to the `Demo <demo.html>`_ section for the latest information on using the VERA web portal.*

In the **VLAT_Demo** Unity project, we have created a premade script and logger in Unity for your experiment.

If you have not already installed the VLAT demo, it can be cloned to your device using the command prompt/terminal:

.. code-block:: bash

   git clone https://github.com/many-realities-studio/VLAT_Demo.git


Open the project with the Unity Hub and click on the **Demo Scene** scene in the **Assets** folder.

Below are various instructions that relate to setting up the **VLAT_Demo** Unity project to use the VERA tools included in the VERA suite:

1. **Export VERA Package**:

   - Click the link below to download the VERA Unity package:
   - (https://sreal.ucf.edu/vera-portal/static/VERA-Unity-plugin-0.1.0.unitypackage)


2. **Import the exported VERA package into the VLAT_Demo project:**

   - Clone the VLAT Demo repository using:


   .. code-block:: bash

      git clone https://github.com/many-realities-studio/ISMAR24-VERA-Tutorial.git


   - Open the project in Unity.
   - Go to **Assets > Import Package > Custom Package**, and ensure you are importing the entire VERA package and its contents.
   - Click **Import** to import the package into the demo project.
   - See official Unity documentation for more details
   - https://docs.unity3d.com/Manual/AssetPackagesImport.html

.. image:: /_static/8.png
   :alt: Example
   :width: 300px
   :align: center
   
3. **Log in to the VERA site:**

   - Go to the VERA web application: https://sreal.ucf.edu/vera-portal/

   - Login or create your account

   - After logging in or creating an account, create a new experiment by selecting **Create new experiment**.

4. **Set up a VERA Logger:**

   - Return to the **VLAT_Demo** Unity project.
   - Open the **Demo Scene** scene (which can be found in the **Assets** folder).
   - On the top navigation bar of Unity, find the **VERA** field and click **Settings**.

   .. image:: /_static/vera_settings.png
      :alt: Open VERA settings
      :width: 300px
      :align: center

   - You should now see VERA Settings in your inspector on the right side of your screen.

   .. image:: /_static/authenticate.png
      :alt: Authenticate with VERA
      :width: 300px
      :align: center

   - Click **Authenticate** and you should be redirected to an authenticate page of the web browser which will redirect you to your dashboard.

   - Switch back to Unity and you should see some new fields for the VERA Settings in your inspector. There is an option to select an experiment. Click **No active experiment** and select the experiment you just made.

   .. image:: /_static/select_experiment.png
      :alt: Experiment selection
      :width: 300px
      :align: center

- After selecting your experiment, create an empty game object called **VERA Logger**. Add a **VERALogger** script component to the game object. This component will allow you to log various items to a .csv file, which can be uploaded to the VERA web interface.
- At the bottom of the inspector panel for the **VERALogger** script component, click **Create column definition**. This will define how your logs and .csv files will be formatted.
- By default, a column definition will only have **ts** (timestamp) and **eventId** (an ID associated with the log) columns. You can add more columns by pressing the **Add column** button. Add a column for an object’s **Transform**, giving the column whatever name you wish and setting the type to **Transform**.

.. image:: /_static/10.png
   :alt: Example
   :width: 300px
   :align: center

5. **Generate logs of important events:**

   In this demo scene, a user must grab a key, use it to unlock a castle door, and then use a cannon to destroy three pumpkins. Let’s set up VERA to create data points with timestamps for each of these important events and save the player transform with them.

   - In the **Hierarchy** view, select the **Key** game object (which can be found under the **Interactables** dropdown). We will now set up an event log for when the key is first picked up. In the log, we want to know the time the key was picked up, the transform of the player when it was picked up, and a custom identifier relating specifically to this event (let’s say **0** is the ID associated with picking up the key for the first time).
   - Add an **EventActionLogger** script component to the key object. This component will allow us to easily log an event with the VERA Logger, providing a timestamp, custom event ID, and transform of a particular object. 
   - In the inspector panel for the EventActionLogger, add the game object whose transform you’d like to be logged when the event occurs. In this case, we’d like to log the player’s position, so drag in the **XR Origin** game object. 
   - The **Only Allow One Log For Entry** checkbox will determine whether only one log can be associated with this logger. If the checkbox is selected, only one log can be sent out from this logger (e.g., for unique or **first time** events); if the checkbox is unselected, multiple logs can be sent out from this logger (e.g., for non-unique or **repeating** events). Picking up the key for the first time is a **unique** event which only occurs once, so we can select the checkbox. See screenshot below for example setup.


.. image:: /_static/11.png
   :alt: Example
   :width: 300px
   :align: center

- Now, to trigger a log, we can call the **LogEvent** function of this EventActionLogger. We want a log to trigger when the key is first picked up. We can detect when the key is first picked up using the **XR Grab Interactable** component of the key. Inspect the **XR Grab Interactable** component of the key, scroll down to the **Interactable Events** section, and expand the region to see various events associated with the interactable. Scroll down to find the **First Select Entered** event, which triggers whenever the interactable is selected for the first time.
- Add an item to the list, and drag the key game object to be the associated object for the new list item. You can then select the **No function** dropdown to choose a function that will be triggered. Select the **EventActionLogger** -> **LogEvent (int)** function.
- As a parameter, we can pass what event ID we would like to be logged alongside this event’s triggering. Set the value to 0, since that is the ID we decided to associate with the key being picked up for the first time.


.. image:: /_static/12.png
   :alt: Example
   :width: 300px
   :align: center

Now, let’s set up a similar functionality for when the door is unlocked. 

    - Find the **Door** game object in the hierarchy (which can be found under **interactables**). Expand the **Door** game object, and find the **Padlock** game object.    

.. image:: /_static/13.png
   :alt: Example
   :width: 300px
   :align: center
    
- Add an **EventActionLogger** to the padlock. Drag the XR Origin as the target object (to log the player’s position when the event occurs), and select the **Only Allow One Log For Entry** checkbox (since unlocking the door can only occur once).
- Under the **Lock** script component, there is an event called when the door is unlocked. Add the EventActionLogger as an item for the event, choose the **LogEvent** function, and pass an ID of 1 (which will be the ID associated with unlocking the door).


.. image:: /_static/14.png
   :alt: Example
   :width: 300px
   :align: center

Now, let’s set up similar functionality for when a pumpkin is destroyed. 
    
    - Find the **Pumpkins** game object in the hierarchy (which can be found under **interactables**). Expand the **Pumpkins** game object, and find the three **pump1Breakable** game objects (screenshot below).

.. image:: /_static/15.png
   :alt: Example
   :width: 300px
   :align: center

- Add an **EventActionLogger** to each pumpkin. Drag each pumpkin as the target object (to log the position of the pumpkin which was destroyed).
- Under the **BreakablePumpkin** script component, there is an event which is called when the pumpkin is destroyed. Add the EventActionLogger as an item for the event, choose the **LogEvent** function, and pass an ID of 2 (which will be the ID associated with destroying a pumpkin). See screenshot below for example setup.

.. image:: /_static/16.png
   :alt: Example
   :width: 300px
   :align: center

6. **Run the project, trigger the logs, and submit the CSV:**

    - Run the project, and perform the tasks as usual (grab the key, unlock the door, use the cannon to destroy the pumpkins).
    - Once you have finished, before exiting play mode, select the **VERA Logger** object, it can be found inside DontDestroyOnLoad in the hierarchy. In the inspector panel for the VERALogger script component, at the bottom of the component, click the **Submit CSV** button. This will submit a .csv file with the associated logs taken during the experiment.

.. image:: /_static/17.png
   :alt: Example
   :width: 300px
   :align: center

- In the VERA web interface, go to the experiment view for the experiment associated with the Unity project. Refresh the page, and you should see a single entry for the session you just completed.

.. image:: /_static/18.png
   :alt: Example
   :width: 300px
   :align: center

- You can now download the CSV file associated with the session (click the **CSV** button on the right), or view the logs which are in the CSV (click the **Logs** button). Viewing the CSV file or the logs, we can see the logged information from the session (ID 0 representing when the key was first picked up, ID 1 representing when the door was unlocked, and ID 2 representing when a pumpkin was destroyed).

.. image:: /_static/19.png
   :alt: Example
   :width: 300px
   :align: center

7. **Set up locomotion accessibility tools:**

Various locomotion accessibility tools are available to aid disabled participants in completing your studies. These tools are called the VERA Locomotion Accessibility Toolkit (the VLAT).
    
- To set up the VLAT, use the project folder view to find the **VERA Menu** prefab, which can be found in the folder path **Assets** -> **VERA** -> **VLAT Locomotion Accessibility Toolkit** -> **Prefabs** -> **VLAT_Menu**.
- Drag and drop the VLAT Menu as a child component of the scene’s main camera. The demo scene’s main camera can be found as a child object of the XR Origin game object, **XR Origin** -> **Camera Offset** -> **Main Camera**.


.. image:: /_static/20.png
   :alt: Example
   :width: 300px
   :align: center

- Select the VLAT_Menu game object, and set up various required parameters in the **VLAT_Options** script component. Use the inspector to set up these values. Most notably, a reference to your XR player (the **Xr Player Parent** reference field; in this case, the **XR Origin** game object will suffice) is required. A setup with example parameters is given below.

.. image:: /_static/21.png
   :alt: Example
   :width: 300px
   :align: center

- Run the project and ensure the VLAT menu shows up and can be used to **Look** and **Move** around the environment. The menu can be navigated using **X/Y/A/B** on the VR controllers or using **1/2/3/4** on a keyboard. See the screenshot below to see the VLAT menu as it should appear in-game.

.. image:: /_static/22.png
   :alt: Example
   :width: 300px
   :align: center

For more information on the VLAT, refer to the **VERA Accessibility Toolkit (VLAT)** section.


8. **Set up accessible interactable objects:**
The VLAT requires you to annotate **interactable** objects with specific **interactions.** In this project, there are three major interactable objects, notably, the key, the door, and the cannon. Let’s set up these objects as VLAT interactable objects.

    - Select the **Key** game object. Add a **VLAT_Interactable** script component, which tells the VLAT that this game object is an interactable object.
    - In the inspector of the VLAT_Interactable script component, set the name to be **Key**. This is the name that will be displayed when interacting with the object.

.. image:: /_static/23.png
   :alt: Example
   :width: 300px
   :align: center

- The **Interactions** list defines all the interactions which can be performed on this object. In the case of the key, there is only one major interaction, which is to pick up / drop the key. Add an interaction using the **+** button, and specify it **Grab/Drop** as the **Interaction Name**.

.. image:: /_static/24.png
   :alt: Example
   :width: 300px
   :align: center

- This interaction will now be visible when users attempt to interact with the object using the VLAT. They can subsequently trigger the interaction, which will call whatever functions are listed under the **OnTriggerInteraction** list.
- The VLAT includes a helper script called **VLAT_GrabInteractable**, to allow users to pick up / drop an object using the VLAT. Add a VLAT_GrabInteractable script to the key.
- Add an entry to the **OnTriggerInteraction** list, and put the key as the object reference. In the function dropdown, select **VLAT_GrabInteractable** -> **GrabAndRelease**.
- Now, when the **Grab/Drop** interaction of the **Key** is selected, the **GrabAndRelease** function of the **VLAT_GrabInteractable** will be called, allowing the user to grab or release the interactable object.

.. image:: /_static/25.png
   :alt: Example
   :width: 300px
   :align: center

- If the key is grabbed for the first time, we would like to still trigger our VERA log for event 0, associated with grabbing the key for the first time. We can ensure this occurs by adding another item to the OnTriggerInteraction list, and adding the **EventActionLogger** -> **LogEvent (int)** as the function. Since the event is set to only log once (on our EventActionLogger, **Only Allow One Log For Entry** is set to true), only the first time this log is called will it actually log the event.

.. image:: /_static/26.png
   :alt: Example
   :width: 300px
   :align: center

Similarly, let’s set up the door to be interactable. 
    
- Select the **Door** game object, and add a VLAT_Interactable component, setting the name to **Door** and adding one interaction for **Open/Close**.


.. image:: /_static/27.png
   :alt: Example
   :width: 300px
   :align: center

Similar to VLAT_GrabInteractable, there is a VLAT_DoorInteractable, to aid with opening and closing doors. Add a VLAT_DoorInteractable to the **DoorL** and **DoorR** game objects (which are children of the **Door** game object).
    
    - Fill in the parameters of the VLAT_DoorInteractables, which are as follows:

        
        - **TwoWayDoor**: whether the door can swing **both ways** (e.g., the door can be **pushed open** OR **pulled open** from closed). If the door can swing both ways, set to true; if it only swings one way (e.g., only **open** and **closed**), set to false.
        - **DoorHingeJoint**: a reference to the door’s hinge joint.
        - **HingeAngle** fields: the numerical value of the hinge’s angle at various points of the door. For example, with the left door, the door is **pushed open** at -90, **closed** at 0, and **pulled open** at 80. You can see these values under the **Limits** of the hinge joint.


.. image:: /_static/28.png
   :alt: Example
   :width: 300px
   :align: center


- Back on the VLAT_Interactable component of the **Door** game object, we can now add these two **VLAT_DoorInteractable** components from the **DoorL** and **DoorR** game objects as items to be triggered by the **Open/Close** interaction. Add two list items, put the DoorL and DoorR objects as references, and select the **VLAT_DoorInteractable** -> **OpenAndCloseDoor** function as the function.

.. image:: /_static/29.png
   :alt: Example
   :width: 300px
   :align: center

- Lastly, add functionality for unlocking the door if the user is carrying the key via the VLAT toolkit. Code for this has been provided in the **Lock** script, on the **Padlock** game object. Add the padblock as another item in the OnTriggerInteraction list, and add the **Lock** -> **TryUnlock** function as the function.

.. image:: /_static/30.png
   :alt: Example
   :width: 300px
   :align: center

- Open the **Lock.cs** script, and uncomment lines 68-71. 

.. image:: /_static/31.png
   :alt: Example
   :width: 300px
   :align: center

Lastly, let’s set up the cannon to be interactable. 
    - On the **Cannon** game object, add a **VLAT_Interactable** component, and name it **Cannon**.
    - Add five interactions, four for aiming (**Aim Up**, **Aim Down**, **Aim Left**, and **Aim Right**), and one for firing the cannon (**Fire**).
    - The **CannonInteractable** script (which is also on this **Cannon** game object) contains functions corresponding to these interactions. Add them as list items for each trigger of each interaction, as listed below (one for aim up, aim down, aim left, aim right, and fire).

.. image:: /_static/32.png
   :alt: Example
   :width: 300px
   :align: center

The key, door, and cannon have all been set up as interactable objects. Run the project and test it, ensuring the objects are able to be interacted with as desired, and all the VERA logs continue to propagate as desired.
